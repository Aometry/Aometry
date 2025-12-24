export enum ChannelCategory {
  AUTH_GENERAL = "AUTH_GENERAL",
  AUTH_SOCMED = "AUTH_SOCMED",
  COMMS_DRAFTS = "COMMS_DRAFTS",
  COMMS_CMTE = "COMMS_CMTE",
  EXEC_META = "EXEC_META",
  MOTIONS = "MOTIONS",
  DECISION_LOG = "DECISION_LOG",
}

/**
 * Categorizes a channel based on its name.
 * Matches specific keywords and emojis as defined in the spec.
 *
 * @param channelName The name of the channel to categorize
 * @returns The matched ChannelCategory or null if no match found
 */
export function getChannelCategory(
  channelName: string
): ChannelCategory | null {
  const normalizedName = channelName.toLowerCase();

  // Check for exact matches or specific substrings that identify the channel uniquely
  switch (normalizedName) {
    case "auth-general":
      return ChannelCategory.AUTH_GENERAL;
    case "auth-socmed":
      return ChannelCategory.AUTH_SOCMED;
    case "comms-drafts":
      return ChannelCategory.COMMS_DRAFTS;
    case "comms-cmte":
      return ChannelCategory.COMMS_CMTE;
    case "exec-meta":
      return ChannelCategory.EXEC_META;
    case "motions":
      return ChannelCategory.MOTIONS;
    case "decision-log":
      return ChannelCategory.DECISION_LOG;
    default:
      return null;
  }
}

export const ChannelCategoryNames: Record<ChannelCategory, string> = {
  [ChannelCategory.AUTH_GENERAL]: "auth-general",
  [ChannelCategory.AUTH_SOCMED]: "auth-socmed",
  [ChannelCategory.COMMS_DRAFTS]: "comms-drafts",
  [ChannelCategory.COMMS_CMTE]: "comms-cmte",
  [ChannelCategory.EXEC_META]: "exec-meta",
  [ChannelCategory.MOTIONS]: "motions",
  [ChannelCategory.DECISION_LOG]: "decision-log",
};
