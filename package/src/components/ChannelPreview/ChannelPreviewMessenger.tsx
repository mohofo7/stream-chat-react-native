import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { ChannelAvatar } from './ChannelAvatar';
import type { ChannelPreviewProps } from './ChannelPreview';
import { ChannelPreviewMessage } from './ChannelPreviewMessage';
import { ChannelPreviewStatus } from './ChannelPreviewStatus';
import { ChannelPreviewTitle } from './ChannelPreviewTitle';
import { ChannelPreviewUnreadCount } from './ChannelPreviewUnreadCount';
import { useChannelPreviewDisplayName } from './hooks/useChannelPreviewDisplayName';

import type { LatestMessagePreview } from './hooks/useLatestMessagePreview';

import {
  ChannelsContextValue,
  useChannelsContext,
} from '../../contexts/channelsContext/ChannelsContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';
import type { StreamChatGenerics } from '../../types/types';
import { vw } from '../../utils/utils';

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  contentContainer: { flex: 1 },
  row: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 8,
  },
  title: { fontSize: 14, fontWeight: '700' },
});

const maxWidth = vw(80) - 16 - 40;

export type ChannelPreviewMessengerPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>, 'channel'> &
  Pick<
    ChannelsContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    | 'maxUnreadCount'
    | 'onSelect'
    | 'PreviewAvatar'
    | 'PreviewMessage'
    | 'PreviewStatus'
    | 'PreviewTitle'
    | 'PreviewUnreadCount'
  > & {
    /**
     * Latest message on a channel, formatted for preview
     *
     * e.g.,
     *
     * ```json
     * {
     *  created_at: '' ,
     *  messageObject: { ... },
     *  previews: {
     *    bold: true,
     *    text: 'This is the message preview text'
     *  },
     *  status: 0 | 1 | 2 // read states of latest message.
     * }
     * ```
     *
     * @overrideType object
     */
    latestMessagePreview: LatestMessagePreview<At, Ch, Co, Ev, Me, Re, Us>;
    /**
     * Formatter function for date of latest message.
     * @param date Message date
     * @returns Formatted date string
     *
     * By default today's date is shown in 'HH:mm A' format and other dates
     * are displayed in 'DD/MM/YY' format. props.latestMessage.created_at is the
     * default formatted date. This default logic is part of ChannelPreview component.
     */
    formatLatestMessageDate?: (date: Date) => string;
    /** Number of unread messages on the channel */
    unread?: number;
  };

const ChannelPreviewMessengerWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channel,
    formatLatestMessageDate,
    latestMessagePreview,
    maxUnreadCount,
    onSelect,
    PreviewAvatar = ChannelAvatar,
    PreviewMessage = ChannelPreviewMessage,
    PreviewStatus = ChannelPreviewStatus,
    PreviewTitle = ChannelPreviewTitle,
    PreviewUnreadCount = ChannelPreviewUnreadCount,
    unread,
  } = props;

  const {
    theme: {
      channelPreview: { container, contentContainer, row, title },
      colors: { border, white_snow },
    },
  } = useTheme();

  const displayName = useChannelPreviewDisplayName(
    channel,
    Math.floor(maxWidth / ((title.fontSize || styles.title.fontSize) / 2)),
  );

  return (
    <TouchableOpacity
      onPress={() => {
        if (onSelect) {
          onSelect(channel);
        }
      }}
      style={[
        styles.container,
        { backgroundColor: white_snow, borderBottomColor: border },
        container,
      ]}
      testID='channel-preview-button'
    >
      <PreviewAvatar channel={channel} />
      <View
        style={[styles.contentContainer, contentContainer]}
        testID={`channel-preview-content-${channel.id}`}
      >
        <View style={[styles.row, row]}>
          <PreviewTitle channel={channel} displayName={displayName} />
          <PreviewUnreadCount channel={channel} maxUnreadCount={maxUnreadCount} unread={unread} />
        </View>
        <View style={[styles.row, row]}>
          <PreviewMessage latestMessagePreview={latestMessagePreview} />
          <PreviewStatus
            channel={channel}
            formatLatestMessageDate={formatLatestMessageDate}
            latestMessagePreview={latestMessagePreview}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export type ChannelPreviewMessengerProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<
  Omit<
    ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'channel' | 'latestMessagePreview'
  >
> &
  Pick<
    ChannelPreviewMessengerPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
    'channel' | 'latestMessagePreview'
  >;

const MemoizedChannelPreviewMessengerWithContext = React.memo(
  ChannelPreviewMessengerWithContext,
) as typeof ChannelPreviewMessengerWithContext;

/**
 * This UI component displays an individual preview item for each channel in a list. It also receives all props
 * from the ChannelPreview component.
 */
export const ChannelPreviewMessenger = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    maxUnreadCount,
    onSelect,
    PreviewAvatar,
    PreviewMessage,
    PreviewStatus,
    PreviewTitle,
    PreviewUnreadCount,
  } = useChannelsContext<At, Ch, Co, Ev, Me, Re, Us>();
  return (
    <MemoizedChannelPreviewMessengerWithContext
      {...{
        maxUnreadCount,
        onSelect,
        PreviewAvatar,
        PreviewMessage,
        PreviewStatus,
        PreviewTitle,
        PreviewUnreadCount,
      }}
      {...props}
    />
  );
};

ChannelPreviewMessenger.displayName = 'ChannelPreviewMessenger{channelPreview}';
