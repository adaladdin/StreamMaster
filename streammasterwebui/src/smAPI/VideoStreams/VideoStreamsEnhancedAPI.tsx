import { singletonVideoStreamsListener } from '../../app/createSingletonListener';
import { isEmptyObject } from '../../common/common';
import isPagedTableDto from '../../components/dataSelector/isPagedTableDto';
import type * as iptv from '../../store/iptvApi';
import { iptvApi } from '../../store/iptvApi';

export const enhancedApiVideoStreams = iptvApi.enhanceEndpoints({
  endpoints: {
    videoStreamsGetChannelLogoDtos: {
      async onCacheEntryAdded(api, { dispatch, getState, updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        try {
          await cacheDataLoaded;

          const updateCachedDataWithResults = (data: iptv.ChannelLogoDto[]) => {
            if (!data || isEmptyObject(data)) {
              console.log('empty', data);
              dispatch(iptvApi.util.invalidateTags(['VideoStreams']));
              return;
            }

            updateCachedData(() => {
              for (const { endpointName, originalArgs } of iptvApi.util.selectInvalidatedBy(getState(), [{ type: 'VideoStreams' }])) {
                if (endpointName !== 'videoStreamsGetChannelLogoDtos') continue;
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

          singletonVideoStreamsListener.addListener(updateCachedDataWithResults);

          await cacheEntryRemoved;
          singletonVideoStreamsListener.removeListener(updateCachedDataWithResults);

        } catch (error) {
          console.error('Error in onCacheEntryAdded:', error);
        }

      }
    },
    videoStreamsGetPagedVideoStreams: {
      async onCacheEntryAdded(api, { dispatch, getState, updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        try {
          await cacheDataLoaded;

          const updateCachedDataWithResults = (data: iptv.VideoStreamDto[]) => {
            if (!data || isEmptyObject(data)) {
              console.log('empty', data);
              dispatch(iptvApi.util.invalidateTags(['VideoStreams']));
              return;
            }

            updateCachedData(() => {
              for (const { endpointName, originalArgs } of iptvApi.util.selectInvalidatedBy(getState(), [{ type: 'VideoStreams' }])) {
                if (endpointName !== 'videoStreamsGetPagedVideoStreams') continue;
                dispatch(
                  iptvApi.util.updateQueryData(endpointName, originalArgs, (draft) => {

                    if (isPagedTableDto(data)) {
                      data.forEach(item => {
                        const index = draft.data.findIndex(existingItem => existingItem.id === item.id);
                        if (index !== -1) {
                          draft.data[index] = item;
                        }
                      });

                      return draft;
                    }

                    data.forEach(item => {
                      const index = draft.data.findIndex(existingItem => existingItem.id === item.id);
                      if (index !== -1) {
                        draft.data[index] = item;
                      }
                    });

                    return draft;
                  })
                )
              }


            });
          };

          singletonVideoStreamsListener.addListener(updateCachedDataWithResults);

          await cacheEntryRemoved;
          singletonVideoStreamsListener.removeListener(updateCachedDataWithResults);

        } catch (error) {
          console.error('Error in onCacheEntryAdded:', error);
        }

      }
    },
    videoStreamsGetVideoStream: {
      async onCacheEntryAdded(api, { dispatch, getState, updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        try {
          await cacheDataLoaded;

          const updateCachedDataWithResults = (data: iptv.VideoStreamDto) => {
            updateCachedData(() => {
              console.log('updateCachedData', data);
              for (const { endpointName, originalArgs } of iptvApi.util.selectInvalidatedBy(getState(), [{ type: 'VideoStreams' }])) {
                if (endpointName !== 'videoStreamsGetVideoStream') continue;
                dispatch(iptvApi.util.updateQueryData(endpointName, originalArgs, (draft) => {
                  console.log('updateCachedData', data, draft);
                })
                );
              }


            });
          };

          singletonVideoStreamsListener.addListener(updateCachedDataWithResults);

          await cacheEntryRemoved;
          singletonVideoStreamsListener.removeListener(updateCachedDataWithResults);

        } catch (error) {
          console.error('Error in onCacheEntryAdded:', error);
        }

      }
    },
  }
});
