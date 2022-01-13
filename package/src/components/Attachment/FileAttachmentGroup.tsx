import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Attachment as AttachmentDefault } from './Attachment';

import {
  MessageContextValue,
  useMessageContext,
} from '../../contexts/messageContext/MessageContext';
import {
  MessagesContextValue,
  useMessagesContext,
} from '../../contexts/messagesContext/MessagesContext';
import { useTheme } from '../../contexts/themeContext/ThemeContext';

import type { StreamChatGenerics } from '../../types/types';

const styles = StyleSheet.create({
  container: {
    padding: 4,
  },
});

export type FileAttachmentGroupPropsWithContext<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'files'> &
  Pick<MessagesContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'Attachment'> & {
    /**
     * The unique id for the message with file attachments
     */
    messageId: string;
    styles?: Partial<{
      attachmentContainer: StyleProp<ViewStyle>;
      container: StyleProp<ViewStyle>;
    }>;
  };

const FileAttachmentGroupWithContext = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { Attachment, files, messageId, styles: stylesProp = {} } = props;

  const {
    theme: {
      messageSimple: {
        fileAttachmentGroup: { container },
      },
    },
  } = useTheme();

  return (
    <View style={[styles.container, container, stylesProp.container]}>
      {files.map((file, index) => (
        <View
          key={`${messageId}-${index}`}
          style={[
            { paddingBottom: index !== files.length - 1 ? 4 : 0 },
            stylesProp.attachmentContainer,
          ]}
        >
          <Attachment attachment={file} />
        </View>
      ))}
    </View>
  );
};

const areEqual = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  prevProps: FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
  nextProps: FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { files: prevFiles } = prevProps;
  const { files: nextFiles } = nextProps;

  const filesEqual = prevFiles.length === nextFiles.length;

  return filesEqual;
};

const MemoizedFileAttachmentGroup = React.memo(
  FileAttachmentGroupWithContext,
  areEqual,
) as typeof FileAttachmentGroupWithContext;

export type FileAttachmentGroupProps<StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics> = Partial<Omit<FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'messageId'>> &
  Pick<FileAttachmentGroupPropsWithContext<At, Ch, Co, Ev, Me, Re, Us>, 'messageId'>;

export const FileAttachmentGroup = <StreamChatClient extends StreamChatGenerics = DefaultStreamChatGenerics>(
  props: FileAttachmentGroupProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { files: propFiles, messageId } = props;

  const { files: contextFiles } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { Attachment = AttachmentDefault } = useMessagesContext<At, Ch, Co, Ev, Me, Re, Us>();

  const files = propFiles || contextFiles;

  if (!files.length) return null;

  return (
    <MemoizedFileAttachmentGroup
      {...{
        Attachment,
        files,
        messageId,
      }}
    />
  );
};

FileAttachmentGroup.displayName = 'FileAttachmentGroup{messageSimple{fileAttachmentGroup}}';
