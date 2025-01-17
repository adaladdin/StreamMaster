﻿using StreamMaster.SchedulesDirectAPI;
using StreamMaster.SchedulesDirectAPI.Models;

namespace StreamMasterApplication.SchedulesDirectAPI.Queries;

public record GetLineupPreviews : IRequest<List<LineUpPreview>>;

internal class GetLineupPreviewsHandler(ISettingsService settingsService) : IRequestHandler<GetLineupPreviews, List<LineUpPreview>>
{
    public async Task<List<LineUpPreview>> Handle(GetLineupPreviews request, CancellationToken cancellationToken)
    {
        Setting setting = await settingsService.GetSettingsAsync();
        SchedulesDirect sd = new(setting.ClientUserAgent, setting.SDCountry, setting.SDPassword);

        List<LineUpPreview> ret = await sd.GetLineUpPreviews(cancellationToken).ConfigureAwait(false);

        return ret;
    }
}
