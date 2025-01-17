﻿using StreamMasterApplication.VideoStreams.Events;

namespace StreamMasterApplication.VideoStreams.Commands;

public record ReSetVideoStreamsLogoRequest(List<string> Ids) : IRequest<List<VideoStreamDto>> { }

[LogExecutionTimeAspect]
public class ReSetVideoStreamsLogoRequestHandler : BaseMediatorRequestHandler, IRequestHandler<ReSetVideoStreamsLogoRequest, List<VideoStreamDto>>
{
    public ReSetVideoStreamsLogoRequestHandler(ILogger<ReSetVideoStreamsLogoRequest> logger, IRepositoryWrapper repository, IMapper mapper,ISettingsService settingsService, IPublisher publisher, ISender sender, IHubContext<StreamMasterHub, IStreamMasterHub> hubContext, IMemoryCache memoryCache)
 : base(logger, repository, mapper, settingsService, publisher, sender, hubContext, memoryCache) { }


    public async Task<List<VideoStreamDto>> Handle(ReSetVideoStreamsLogoRequest request, CancellationToken cancellationToken)
    {
        List<VideoStreamDto> results = await Repository.VideoStream.ReSetVideoStreamsLogoFromIds(request.Ids, cancellationToken).ConfigureAwait(false);

        if (results.Any())
        {
            await Publisher.Publish(new UpdateVideoStreamsEvent(results), cancellationToken).ConfigureAwait(false);
        }

        return results;
    }
}
