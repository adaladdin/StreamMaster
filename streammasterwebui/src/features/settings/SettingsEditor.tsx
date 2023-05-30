/* eslint-disable @typescript-eslint/no-unused-vars */
import './SettingsEditor.css';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import React from 'react';
import { Fieldset } from 'primereact/fieldset';
import { useSettingsGetSettingQuery, type SettingDto } from '../../store/iptvApi';
import { UpdateSetting } from '../../store/signlar_functions';
import { SettingsEditorIcon } from '../../common/icons';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { BlockUI } from 'primereact/blockui';
import { type MenuItem } from 'primereact/menuitem';
import { Dock } from 'primereact/dock';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import HistoryIcon from '@mui/icons-material/History';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { StreamingProxyTypes } from '../../store/streammaster_enums';
import { type SelectItem } from 'primereact/selectitem';
import { InputNumber } from 'primereact/inputnumber';
import { Password } from 'primereact/password';

export const SettingsEditor = () => {
  const toast = React.useRef<Toast>(null);

  const [newData, setNewData] = React.useState<SettingDto>({} as SettingDto);
  const [originalData, setOriginalData] = React.useState<SettingDto>({} as SettingDto);

  const settingsQuery = useSettingsGetSettingQuery();

  React.useMemo(() => {
    if (settingsQuery.isLoading || !settingsQuery.data)
      return;

    setNewData({ ...settingsQuery.data });
    setOriginalData({ ...settingsQuery.data });

  }, [settingsQuery]);

  const isSaveEnabled = React.useMemo((): boolean => {
    if (JSON.stringify(newData) === JSON.stringify(originalData))
      return false;

    return true;
  }, [newData, originalData]);

  const getLine = React.useCallback((label: string, value: React.ReactElement) => {
    return (
      <div className='flex col-12'>
        <div className='flex col-2 col-offset-1'>
          <span>{label}</span>
        </div>
        <div className='flex col-3 m-0 p-0 debug'>
          {value}
        </div>
      </div>
    );
  }, []);

  const getRecord = React.useCallback((fieldName: string) => {
    type ObjectKey = keyof typeof newData;
    const record = newData[fieldName as ObjectKey];
    if (record === undefined || record === null || record === '') {
      return undefined;
    }

    return record;
  }, [newData]);

  const getRecordString = React.useCallback((fieldName: string): string => {
    const record = getRecord(fieldName);
    let toDisplay = JSON.stringify(record);

    if (!toDisplay || toDisplay === undefined || toDisplay === '') {
      return '';
    }

    if (toDisplay.startsWith('"') && toDisplay.endsWith('"')) {
      toDisplay = toDisplay.substring(1, toDisplay.length - 1);
    }

    return toDisplay;
  }, [getRecord]);

  const getInputNumberLine = React.useCallback((label: string, field: string) => {
    return (
      getLine(label + ':',
        <InputNumber
          className="withpadding w-full text-left"
          max={64}
          min={0}
          onValueChange={(e) => setNewData({ ...newData, [field]: e.target.value })}
          placeholder={label}
          showButtons
          size={3}
          value={getRecord(field) as number}
        />)
    );
  }, [getLine, getRecord, newData]);


  const getPasswordLine = React.useCallback((label: string, field: string) => {
    return (
      getLine(label + ':',
        <Password
          className="withpadding"
          feedback={false}
          onChange={(e) => setNewData({ ...newData, [field]: e.target.value })}
          placeholder={label}
          toggleMask
          value={getRecordString(field)}
        />)
    );
  }, [getLine, getRecordString, newData]);

  const getInputTextLine = React.useCallback((label: string, field: string) => {
    return (
      getLine(label + ':',
        <InputText
          className="withpadding w-full text-left"
          onChange={(e) => setNewData({ ...newData, [field]: e.target.value })}
          placeholder={label}
          value={getRecordString(field)}
        />)
    );
  }, [getLine, getRecordString, newData]);

  const getCheckBoxLine = React.useCallback((label: string, field: string) => {
    return (
      getLine(label + ':',
        <Checkbox
          checked={getRecord(field) as boolean}
          className="w-full text-left"
          onChange={(e) => setNewData({ ...newData, [field]: !e.target.value })}
          placeholder={label}
          value={getRecord(field) as boolean}
        />)
    );
  }, [getLine, getRecord, newData]);

  const getHandlersOptions = (): SelectItem[] => {
    const test = Object.entries(StreamingProxyTypes)
      .splice(0, Object.keys(StreamingProxyTypes).length / 2)
      .map(([number, word]) => {
        return {
          label: word,
          value: number,
        } as SelectItem;
      });

    return test;
  };

  const getDropDownLine = React.useCallback((label: string, field: string, options: SelectItem[]) => {
    return (
      <>
        {
          getLine(label + ':',
            <Dropdown
              className="w-full text-left"
              onChange={(e) => setNewData({ ...newData, [field]: parseInt(e.target.value) })}
              options={options}
              placeholder={label}
              value={getRecordString(field)}
            />)
        }
      </>
    );
  }, [getLine, getRecordString, newData]);

  const onSave = React.useCallback(() => {
    if (!isSaveEnabled) {
      return;
    }

    UpdateSetting(newData)
      .then((returnData) => {
        if (toast.current) {
          if (returnData) {
            toast.current.show({
              detail: `Update Settings Successful`,
              life: 3000,
              severity: 'success',
              summary: 'Successful',
            });
          } else {
            toast.current.show({
              detail: `Update Settings Failed`,
              life: 3000,
              severity: 'error',
              summary: 'Error',
            });
          }
        }
      }).catch((e) => {
        if (toast.current) {
          toast.current.show({
            detail: `Update Settings Failed`,
            life: 3000,
            severity: 'error',
            summary: 'Error ' + e.message,
          });
        }
      });
  }, [isSaveEnabled, newData, toast]);

  const items: MenuItem[] = [
    {
      command: () => {
        onSave();
      },
      disabled: !isSaveEnabled,
      icon: <SaveIcon sx={{ fontSize: 40 }} />,
      label: 'Save',
    },
    {
      command: () => {
        setNewData({ ...originalData });
        toast.current?.show({ detail: 'Undo', life: 3000, severity: 'info', summary: 'Info' });
      },
      disabled: !isSaveEnabled,
      icon: <HistoryIcon sx={{ fontSize: 40 }} />,
      label: 'Undo',
    },
  ];


  if (newData === undefined || newData === null || newData.deviceID === undefined || settingsQuery.isLoading) {
    return (
      <>
        Loading...
      </>
    )
  }

  return (
    <div className="settingsEditor">
      <Toast position="bottom-right" ref={toast} />
      <Dock model={items} position='right' />
      <div className="justify-content-between align-items-center">
        <div className="flex justify-content-start align-items-center w-full text-left font-bold text-white-500 surface-overlay justify-content-start align-items-center">
          <SettingsEditorIcon className='p-0 mr-1' />
          {SettingsEditor.displayName?.toUpperCase()}
        </div >

        <Fieldset className="mt-4 pt-10" legend="General">
          {getInputTextLine('Device ID', 'deviceID')}
        </Fieldset>

        <Fieldset className="mt-4 pt-10" legend="Streaming" >
          {getDropDownLine('Enable Stream Buffer', 'streamingProxyType', getHandlersOptions())}
          {getInputNumberLine('Buffer Size', 'ringBufferSizeMB')}
        </Fieldset>

        <Fieldset className="mt-4 pt-10" legend="Files / EPG" >
          {getCheckBoxLine('Cache Icons', 'cacheIcons')}
          {getInputTextLine('SD Username', 'sdUserName')}
          {getPasswordLine('SD Password', 'sdPassword')}
        </Fieldset>

        <Fieldset className="mt-4 pt-10" legend="Backup" />

      </div >
    </div >

  );
};

SettingsEditor.displayName = 'Settings';
export default React.memo(SettingsEditor);