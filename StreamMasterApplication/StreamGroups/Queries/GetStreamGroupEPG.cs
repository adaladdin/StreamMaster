﻿using FluentValidation;

using Microsoft.AspNetCore.Http;

using StreamMasterApplication.Common.Extensions;

using StreamMasterDomain.EPG;
using StreamMasterDomain.Models;

using System.Collections.Concurrent;
using System.Net;
using System.Text.RegularExpressions;
using System.Xml.Serialization;

using static StreamMasterDomain.Common.GetStreamGroupEPGHandler;

namespace StreamMasterApplication.StreamGroups.Queries;

[RequireAll]
public record GetStreamGroupEPG(int StreamGroupId) : IRequest<string>;

public class GetStreamGroupEPGValidator : AbstractValidator<GetStreamGroupEPG>
{
    public GetStreamGroupEPGValidator()
    {
        _ = RuleFor(v => v.StreamGroupId)
            .NotNull().GreaterThanOrEqualTo(0);
    }
}

public class GetStreamGroupEPGHandler(IHttpContextAccessor httpContextAccessor, ILogger<GetStreamGroupEPG> logger, IRepositoryWrapper repository, IMapper mapper, ISettingsService settingsService, IPublisher publisher, ISender sender, IHubContext<StreamMasterHub, IStreamMasterHub> hubContext, IMemoryCache memoryCache) : BaseMediatorRequestHandler(logger, repository, mapper, settingsService, publisher, sender, hubContext, memoryCache), IRequestHandler<GetStreamGroupEPG, string>
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    private readonly object Lock = new();
    private int dummyCount = 0;

    private readonly ParallelOptions parallelOptions = new()
    {
        MaxDegreeOfParallelism = Environment.ProcessorCount
    };

    public string GetIconUrl(string iconOriginalSource, Setting setting)
    {
        string url = _httpContextAccessor.GetUrl();

        if (string.IsNullOrEmpty(iconOriginalSource))
        {
            iconOriginalSource = $"{url}{setting.DefaultIcon}";
            return iconOriginalSource;
        }

        string originalUrl = iconOriginalSource;

        if (iconOriginalSource.StartsWith('/'))
        {
            iconOriginalSource = iconOriginalSource[1..];
        }

        if (iconOriginalSource.StartsWith("images/"))
        {
            iconOriginalSource = $"{url}/{iconOriginalSource}";
        }
        else if (!iconOriginalSource.StartsWith("http"))
        {
            iconOriginalSource = GetApiUrl(SMFileTypes.TvLogo, originalUrl);
        }
        else if (setting.CacheIcons)
        {
            iconOriginalSource = GetApiUrl(SMFileTypes.Icon, originalUrl);
        }

        return iconOriginalSource;
    }

    [LogExecutionTimeAspect]
    public async Task<string> Handle(GetStreamGroupEPG request, CancellationToken cancellationToken)
    {
        List<VideoStreamDto> videoStreams = await Repository.StreamGroupVideoStream.GetStreamGroupVideoStreams(request.StreamGroupId, cancellationToken);

        if (!videoStreams.Any())
        {
            return "";
        }

        Tv epgData = await PrepareEpgData(videoStreams);

        return SerializeEpgData(epgData);
    }

    [LogExecutionTimeAspect]
    private async Task<Tv> PrepareEpgData(IEnumerable<VideoStreamDto> videoStreams)
    {
        HashSet<string> epgids = new(videoStreams.Where(a => !a.IsHidden).Select(r => r.User_Tvg_ID));

        List<Programme> cachedProgrammes = MemoryCache.Programmes();
        List<IconFileDto> cachedIcons = MemoryCache.Icons();

        List<Programme> programmes = cachedProgrammes
            .Where(a => a.StartDateTime > DateTime.Now.AddDays(-1) &&
                        a.Channel != null &&
                        (epgids.Contains(a.Channel) || epgids.Contains(a.DisplayName)))
            .ToList();

        List<IconFileDto> icons = cachedIcons;

        ConcurrentBag<TvChannel> retChannels = new();
        ConcurrentBag<Programme> retProgrammes = new();
        Setting setting = await GetSettingsAsync();
        Parallel.ForEach(videoStreams, parallelOptions, videoStream =>
        {
            TvChannel? tvChannel = CreateTvChannel(videoStream, setting);
            if (tvChannel != null)
            {
                retChannels.Add(tvChannel);
            }

            List<Programme> programmeList = ProcessProgrammesForVideoStream(videoStream, programmes, icons);
            foreach (Programme programme in programmeList)
            {
                retProgrammes.Add(programme);
            }
        });

        return new Tv
        {
            Channel = retChannels.ToList(),
            Programme = retProgrammes.ToList()
        };
    }

    private TvChannel CreateTvChannel(VideoStreamDto? videoStream, Setting setting)
    {
        if (videoStream == null)
        {
            return null;
        }

        string? logo = GetIconUrl(videoStream.User_Tvg_logo, setting);

        // Check if it's a dummy stream
        bool isDummyStream = IsVideoStreamADummy(videoStream, setting) || videoStream.User_Tvg_ID?.ToLower() == "dummy";

        // Build the TvChannel based on whether it's a dummy or not
        if (isDummyStream)
        {
            string orginalName = videoStream.User_Tvg_name;
            int dummy = GetDummy();
            videoStream.User_Tvg_name = "dummy-" + dummy;

            return new TvChannel
            {
                Id = videoStream.User_Tvg_ID,
                Icon = new TvIcon { Src = logo ?? string.Empty },
                Displayname = new List<string>
            {
               orginalName,videoStream.User_Tvg_name
            }
            };
        }
        else
        {
            return new TvChannel
            {
                Id = videoStream.User_Tvg_ID,
                Icon = new TvIcon { Src = logo ?? string.Empty },
                Displayname = new List<string>
            {
               videoStream.User_Tvg_name
            }
            };
        }
    }

    private List<Programme> ProcessProgrammesForVideoStream(VideoStreamDto videoStream, List<Programme> cachedProgrammes, List<IconFileDto> cachedIcons)
    {
        if (videoStream.User_Tvg_ID == null)
        {
            // Decide what to do if User_Tvg_ID is null. Here, we're returning an empty list.
            return new List<Programme>();
        }

        //string userTvgIdLower = videoStream.User_Tvg_ID.ToLower();

        if (videoStream.User_Tvg_ID.StartsWith("dummy-"))
        {
            return HandleDummyStream(videoStream);
        }
        else
        {
            return ProcessNonDummyStreams(videoStream, cachedProgrammes, cachedIcons);
        }
    }

    private List<Programme> HandleDummyStream(VideoStreamDto videoStream)
    {
        List<Programme> programmesForStream = new();

        Programme prog = new()
        {
            Channel = videoStream.User_Tvg_name,
            Title = new TvTitle
            {
                Lang = "en",
                Text = videoStream.User_Tvg_name
            },
            Desc = new TvDesc
            {
                Lang = "en",
                Text = videoStream.User_Tvg_name
            }
        };

        DateTime now = DateTime.Now;
        prog.Icon.Add(new TvIcon { Height = "10", Width = "10", Src = $"{_httpContextAccessor.GetUrl()}/images/transparent.png" });
        prog.Start = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0).ToString("yyyyMMddHHmmss zzz").Replace(":", "");
        now = now.AddDays(7);
        prog.Stop = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0).ToString("yyyyMMddHHmmss zzz").Replace(":", "");
        prog.New = null;
        prog.Previouslyshown = null;

        programmesForStream.Add(prog);
        return programmesForStream;
    }

    private List<Programme> ProcessNonDummyStreams(VideoStreamDto videoStream, List<Programme> cachedProgrammes, List<IconFileDto> cachedIcons)
    {
        List<Programme> programmesForStream = new();

        foreach (Programme? prog in cachedProgrammes.Where(p => p.Channel == videoStream.User_Tvg_ID))
        {
            AdjustProgrammeIcons(prog, cachedIcons);

            prog.Channel = videoStream.User_Tvg_ID;
            if (string.IsNullOrEmpty(prog.New))
            {
                prog.New = null;
            }

            if (string.IsNullOrEmpty(prog.Live))
            {
                prog.Live = null;
            }

            if (string.IsNullOrEmpty(prog.Premiere))
            {
                prog.Premiere = null;
            }

            if (prog.Previouslyshown == null || string.IsNullOrEmpty(prog.Previouslyshown.Start))
            {
                prog.Previouslyshown = null;
            }

            programmesForStream.Add(prog);
        }

        return programmesForStream;
    }

    private void AdjustProgrammeIcons(Programme prog, List<IconFileDto> cachedIcons)
    {
        foreach (TvIcon icon in prog.Icon)
        {
            if (!string.IsNullOrEmpty(icon.Src))
            {
                IconFileDto? programmeIcon = cachedIcons.FirstOrDefault(a => a.SMFileType == SMFileTypes.ProgrammeIcon && a.Source == icon.Src);
                if (programmeIcon != null)
                {
                    icon.Src = GetApiUrl(SMFileTypes.ProgrammeIcon, programmeIcon.Source);
                }
            }
        }

        if (!prog.Icon.Any())
        {
            prog.Icon.Add(new TvIcon { Height = "", Width = "", Src = "" });
        }
    }

    [LogExecutionTimeAspect]
    private static string SerializeEpgData(Tv epgData)
    {
        XmlSerializerNamespaces ns = new();
        ns.Add("", "");

        using Utf8StringWriter textWriter = new();
        XmlSerializer serializer = new(typeof(Tv));
        serializer.Serialize(textWriter, epgData, ns);
        return textWriter.ToString();
    }

    [LogExecutionTimeAspect]
    private List<Programme> GetRelevantProgrammes(List<string> epgids)
    {
        return MemoryCache.Programmes()
            .Where(a =>
                a.StartDateTime > DateTime.Now.AddDays(-1) &&
                a.StopDateTime < DateTime.Now.AddDays(7) &&
                a.Channel != null &&
                (epgids.Contains(a.Channel) ||
                epgids.Contains(a.DisplayName))
            ).ToList();
    }

    private string GetApiUrl(SMFileTypes path, string source)
    {
        string url = _httpContextAccessor.GetUrl();
        return $"{url}/api/files/{(int)path}/{WebUtility.UrlEncode(source)}";
    }

    private int GetDummy()
    {
        return Interlocked.Increment(ref dummyCount);
    }

    private bool IsNotInProgrammes(IEnumerable<Programme> programmes, VideoStream videoStream)
    {
        return !programmes.Any(p => p.Channel == videoStream.User_Tvg_ID);
    }

    private bool IsVideoStreamADummy(VideoStreamDto videoStream, Setting setting)
    {
        if (string.IsNullOrEmpty(videoStream.User_Tvg_ID))
        {
            return true;
        }

        return !string.IsNullOrEmpty(setting.DummyRegex) &&
               new Regex(setting.DummyRegex, RegexOptions.ECMAScript | RegexOptions.IgnoreCase).IsMatch(videoStream.User_Tvg_ID);
    }
}