
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { memo, useCallback, useMemo, useRef, type CSSProperties } from "react";
import { formatJSONDateString, getTopToolOptions } from "../../common/common";
import DataSelector from "../../components/dataSelector/DataSelector";
import { type ColumnMeta } from "../../components/dataSelector/DataSelectorTypes";

import { FailClient } from "../../smAPI/VideoStreams/VideoStreamsMutateAPI";
import { type FailClientRequest, type StreamStatisticsResult } from "../../store/iptvApi";


const StreamingClientsPanel = (props: StreamingClientsPanelProps) => {
  const toast = useRef<Toast>(null);
  const clientBitsPerSecondTemplate = useCallback((rowData: StreamStatisticsResult) => {
    if (rowData.clientBitsPerSecond === undefined) return <div />;

    const kbps = rowData.clientBitsPerSecond / 1000;
    const roundedKbps = Math.ceil(kbps);

    return (<div>{roundedKbps.toLocaleString('en-US')}</div >);
  }, []);



  const clientStartTimeTemplate = useCallback((rowData: StreamStatisticsResult) => {
    return (<div>{formatJSONDateString(rowData.clientStartTime ?? '')}</div>);
  }, []);

  const clientElapsedTimeTemplate = useCallback((rowData: StreamStatisticsResult) => {
    return (<div>{rowData.clientElapsedTime?.split('.')[0]}</div >);
  }, []);

  const onFailClient = useCallback(async (rowData: StreamStatisticsResult) => {
    if (!rowData.clientId || rowData.clientId === undefined || rowData.clientId === '') {
      return;
    }

    var toSend = {} as FailClientRequest;

    toSend.clientId = rowData.clientId;

    await FailClient(toSend)
      .then(() => {
        if (toast.current) {
          toast.current.show({
            detail: `Failed Client`,
            life: 3000,
            severity: 'success',
            summary: 'Successful',
          });
        }
      }).catch(() => {
        if (toast.current) {
          toast.current.show({
            detail: `Failed to Fail Client`,
            life: 3000,
            severity: 'error',
            summary: 'Error'
          });
        }
      });

  }, []);

  const targetActionBodyTemplate = useCallback((rowData: StreamStatisticsResult) => {

    return (
      <div className="dataselector p-inputgroup align-items-center justify-content-end">
        <Button
          className="p-button-danger"
          icon="pi pi-times"
          onClick={async () => await onFailClient(rowData)}
          rounded
          text
          tooltip="Fail Client"
          tooltipOptions={getTopToolOptions} />
      </div>
    );
  }, [onFailClient]);

  const sourceColumns = useMemo((): ColumnMeta[] => {
    return [

      {
        field: 'clientAgent', header: 'Client/User Agent', style: {
          maxWidth: '14rem',
          width: '14rem',
        } as CSSProperties,
      },
      { field: 'm3UStreamName', header: 'Name' },

      {
        align: 'center', bodyTemplate: clientStartTimeTemplate, field: 'clientStartTime', header: 'Client Start', style: {
          maxWidth: '10rem',
          width: '10rem',
        } as CSSProperties,
      },
      {
        align: 'center', bodyTemplate: clientElapsedTimeTemplate, field: 'clientElapsedTime', header: 'Client Elapsed', style: {
          maxWidth: '10rem',
          width: '10rem',
        } as CSSProperties,
      },
      {
        align: 'center', bodyTemplate: clientBitsPerSecondTemplate, field: 'clientBitsPerSecond', header: 'Client kbps', style: {
          maxWidth: '10rem',
          width: '10rem',
        } as CSSProperties,
      },
      {
        align: 'center', bodyTemplate: targetActionBodyTemplate, field: 'Actions',
        style: {
          maxWidth: '8rem',
          width: '8rem',
        } as CSSProperties,
      },
    ]
  }, [clientBitsPerSecondTemplate, clientElapsedTimeTemplate, clientStartTimeTemplate, targetActionBodyTemplate]);

  return (
    <>
      <Toast position="bottom-right" ref={toast} />
      <div className='m3uFilesEditor flex flex-column col-12 flex-shrink-0 ' >
        <DataSelector
          className={props.className}
          columns={sourceColumns}
          dataSource={props.dataSource}
          emptyMessage="No Clients Streaming"


          id='StreamingServerStatusPanel'
          isLoading={props.isLoading}
          selectedItemsKey='selectSelectedItems'
          style={props.style}

        />
      </div>
    </>
  );
};


StreamingClientsPanel.displayName = 'Streaming Clients Panel';
StreamingClientsPanel.defaultProps = {};
type StreamingClientsPanelProps = {
  readonly className?: string;
  readonly dataSource: StreamStatisticsResult[];
  readonly isLoading: boolean;
  readonly style?: CSSProperties;
}
export default memo(StreamingClientsPanel);
