import { singletonStreamGroupChannelGroupListener } from '../../app/createSingletonListener';
import { isEmptyObject } from '../../common/common';
import isPagedTableDto from '../../components/dataSelector/isPagedTableDto';
import { iptvApi } from '../../store/iptvApi';
import type * as iptv from '../../store/iptvApi';

export const enhancedApiStreamGroupChannelGroup = iptvApi.enhanceEndpoints({
  endpoints: {
    streamGroupChannelGroupGetChannelGroupsFromStreamGroup: {
      async onCacheEntryAdded(api, { dispatch, getState, updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        try {
          await cacheDataLoaded;

          const updateCachedDataWithResults = (data: iptv.ChannelGroupDto[]) => {
            if (!data || isEmptyObject(data)) {
              console.log('empty', data);
              dispatch(iptvApi.util.invalidateTags(['StreamGroupChannelGroup']));
              return;
            }

            updateCachedData(() => {
              for (const { endpointName, originalArgs } of iptvApi.util.selectInvalidatedBy(getState(), [{ type: 'StreamGroupChannelGroup' }])) {
                if (endpointName !== 'streamGroupChannelGroupGetChannelGroupsFromStreamGroup') continue;
                  dispatch(
                    iptvApi.util.updateQueryData(endpointName, originalArgs, (draft) => {

                      if (isPagedTableDto(data)) {
                      data.forEach(item => {
                        const index = draft.findIndex(existingItem => existingItem.id === item.id);
                        if (index !== -1) {
                          draft[index] = item;
                        }
                        });

                        return draft;
                        }

                      data.forEach(item => {
                        const index = draft.findIndex(existingItem => existingItem.id === item.id);
                        if (index !== -1) {
                          draft[index] = item;
                        }
                        });

                      return draft;
                     })
                   )
                 }


            });
          };

         singletonStreamGroupChannelGroupListener.addListener(updateCachedDataWithResults);

        await cacheEntryRemoved;
        singletonStreamGroupChannelGroupListener.removeListener(updateCachedDataWithResults);

        } catch (error) {
          console.error('Error in onCacheEntryAdded:', error);
        }

      }
    },
  }
});
