import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import type {
  ChannelStateAndData,
  ClientStateAndData,
  OwnUserResponse,
  StreamChat,
  UserResponse,
} from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from './types/types';

export const STREAM_CHAT_CLIENT_DATA = 'STREAM_CHAT_CLIENT_DATA';
export const STREAM_CHAT_CHANNELS_DATA = 'STREAM_CHAT_CHANNELS_DATA';
const STREAM_CHAT_SDK_VERSION = 'STREAM_CHAT_SDK_VERSION';
const STREAM_CHAT_CLIENT_VERSION = 'STREAM_CHAT_CLIENT_VERSION';

const CURRENT_SDK_VERSION = require('../package.json').version;
const CURRENT_CLIENT_VERSION = require('stream-chat/package.json').version;

export type CacheKeys =
  | typeof STREAM_CHAT_CLIENT_DATA
  | typeof STREAM_CHAT_CHANNELS_DATA
  | typeof STREAM_CHAT_SDK_VERSION
  | typeof STREAM_CHAT_CLIENT_VERSION;
export type CacheValues<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  STREAM_CHAT_CHANNELS_DATA: ChannelStateAndData<At, Ch, Co, Ev, Me, Re, Us>;
  STREAM_CHAT_CLIENT_DATA: ClientStateAndData<At, Ch, Co, Ev, Me, Re, Us>;
  STREAM_CHAT_CLIENT_VERSION: string;
  STREAM_CHAT_SDK_VERSION: string;
};

export type CacheInterface<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  getItem: <Key extends CacheKeys>(
    key: Key,
  ) => Promise<CacheValues<At, Ch, Co, Ev, Me, Re, Us>[Key] | null>;
  removeItem: <Key extends CacheKeys>(key: Key) => Promise<void>;
  setItem: <Key extends CacheKeys>(key: Key, value: string) => Promise<void>;
};

export type CacheInterfaceSync<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
> = {
  getItem: <Key extends CacheKeys>(key: Key) => CacheValues<At, Ch, Co, Ev, Me, Re, Us>[Key];
  removeItem: <Key extends CacheKeys>(key: Key) => void;
  setItem: <Key extends CacheKeys>(key: Key, value: string) => void;
};

function initialize<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  caceInterface:
    | CacheInterface<At, Ch, Co, Ev, Me, Re, Us>
    | CacheInterfaceSync<At, Ch, Co, Ev, Me, Re, Us>,
  clientData: ClientStateAndData<At, Ch, Co, Ev, Me, Re, Us> | null,
  channelsData: ChannelStateAndData<At, Ch, Co, Ev, Me, Re, Us> | null,
  cachedVersions: { client: string | null; sdk: string | null },
) {
  if (clientData && channelsData) {
    const sdkVersionChanged = cachedVersions.sdk !== CURRENT_SDK_VERSION;
    const clientVersionChanged = cachedVersions.client !== CURRENT_CLIENT_VERSION;
    if (sdkVersionChanged || clientVersionChanged) {
      // This avoids problems if (accross versions) anything changes in the format of the cached data
      console.info(
        'Version change detected on Stream libraries, skipping offline initialization and cleaning up cache...',
      );
      caceInterface.removeItem(STREAM_CHAT_SDK_VERSION);
      caceInterface.removeItem(STREAM_CHAT_CLIENT_VERSION);
      caceInterface.removeItem(STREAM_CHAT_CLIENT_DATA);
      caceInterface.removeItem(STREAM_CHAT_CHANNELS_DATA);
    } else {
      const socketUser = {
        id: clientData.user.id,
        name: clientData.user.name,
      } as OwnUserResponse<Ch, Co, Us> | UserResponse<Us>;

      client.connectUser(socketUser, clientData.token);
      client.reInitializeWithState(clientData, channelsData);
    }
  } else {
    console.info(
      'No cache found for clientData or channelsData. Skipping offline initialization...',
    );
  }

  AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState.match(/inactive|background/)) {
      const { channels: currentChannelsData, client: currentClientData } = client.getStateData();
      caceInterface.setItem(STREAM_CHAT_SDK_VERSION, CURRENT_SDK_VERSION);
      caceInterface.setItem(STREAM_CHAT_CLIENT_VERSION, CURRENT_CLIENT_VERSION);
      caceInterface.setItem(STREAM_CHAT_CLIENT_DATA, currentClientData);
      caceInterface.setItem(STREAM_CHAT_CHANNELS_DATA, currentChannelsData);
    }
  });

  let oldNetworkState = true;

  NetInfo.fetch().then((state) => {
    if (!state.isConnected || !state.isInternetReachable) {
      oldNetworkState = false;
    }
  });

  NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable && !oldNetworkState) {
      client.openConnection();
      oldNetworkState = true;
    } else if ((!state.isConnected || !state.isInternetReachable) && oldNetworkState) {
      oldNetworkState = false;
    }
  });
}

export async function streamCacheSetup<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  caceInterface: CacheInterface<At, Ch, Co, Ev, Me, Re, Us>,
) {
  const clientData = await caceInterface.getItem(STREAM_CHAT_CLIENT_DATA);
  const channelsData = await caceInterface.getItem(STREAM_CHAT_CHANNELS_DATA);

  const sdk = await caceInterface.getItem(STREAM_CHAT_SDK_VERSION);
  const clientVersion = await caceInterface.getItem(STREAM_CHAT_CLIENT_VERSION);

  return initialize<At, Ch, Co, Ev, Me, Re, Us>(client, caceInterface, clientData, channelsData, {
    client: clientVersion,
    sdk,
  });
}

export function streamCacheSetupSync<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(
  client: StreamChat<At, Ch, Co, Ev, Me, Re, Us>,
  caceInterface: CacheInterfaceSync<At, Ch, Co, Ev, Me, Re, Us>,
) {
  const clientData = caceInterface.getItem(STREAM_CHAT_CLIENT_DATA);
  const channelsData = caceInterface.getItem(STREAM_CHAT_CHANNELS_DATA);

  const sdk = caceInterface.getItem(STREAM_CHAT_SDK_VERSION);
  const clientVersion = caceInterface.getItem(STREAM_CHAT_CLIENT_VERSION);

  return initialize<At, Ch, Co, Ev, Me, Re, Us>(client, caceInterface, clientData, channelsData, {
    client: clientVersion,
    sdk,
  });
}

export function streamCacheClear<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(removeItem: CacheInterface<At, Ch, Co, Ev, Me, Re, Us>['removeItem']) {
  return Promise.all([removeItem(STREAM_CHAT_CLIENT_DATA), removeItem(STREAM_CHAT_CHANNELS_DATA)]);
}

export function streamCacheClearSync<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType,
>(removeItem: CacheInterfaceSync<At, Ch, Co, Ev, Me, Re, Us>['removeItem']) {
  return [removeItem(STREAM_CHAT_CLIENT_DATA), removeItem(STREAM_CHAT_CHANNELS_DATA)];
}
