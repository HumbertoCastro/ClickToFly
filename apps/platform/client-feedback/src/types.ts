export type FeedbackMode = 'text' | 'section' | 'image' | 'review';

export type FeedbackItemType =
  | 'text-suggestion'
  | 'section-comment'
  | 'image-comment'
  | 'image-removal';

export type FeedbackStatus = 'new' | 'viewed' | 'in_progress' | 'resolved';

export type ElementBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FeedbackTarget = {
  version: 1;
  primarySelector: string;
  selectorCandidates: string[];
  sectionSelector?: string;
  tagName: string;
  textFingerprint?: string;
  imageSrc?: string;
  clickOffsetRatio?: {
    x: number;
    y: number;
  };
  capturedBounds: ElementBounds;
};

export type FeedbackItem = {
  id: string;
  type: FeedbackItemType;
  label: string;
  selector: string;
  comment: string;
  bounds: ElementBounds;
  target?: FeedbackTarget;
  route: string;
  createdAt: string;
  originalText?: string;
  suggestedText?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type FeedbackSubmission = {
  token: string;
  projectSlug: string;
  route: string;
  reviewer: {
    name: string;
    email: string;
  };
  viewport: {
    width: number;
    height: number;
  };
  items: FeedbackItem[];
  createdAt: string;
};

export type AdminSubmissionSummary = {
  id: string;
  projectSlug: string;
  projectName: string;
  client: string;
  route: string;
  reviewer: {
    name: string;
    email: string;
  };
  itemCount: number;
  status: FeedbackStatus;
  createdAt: string;
  viewedAt: string;
  resolvedAt: string;
  emailStatus: string;
  emailMessageId: string;
};

export type AdminFeedbackSubmission = AdminSubmissionSummary & {
  previewUrl: string;
  viewport: {
    width: number;
    height: number;
  };
  items: FeedbackItem[];
};

export type ReviewSession = {
  token: string;
  projectSlug: string;
  projectName: string;
  client: string;
  route: string;
  previewUrl: string;
  issuedAt: number;
  expiresAt: number;
};

export type DraftFeedback = Omit<FeedbackItem, 'id' | 'createdAt' | 'comment' | 'type'> & {
  type: FeedbackItemType;
  comment: string;
};

export type StoredDraft = {
  version: 1;
  reviewer: {
    name: string;
    email: string;
  };
  items: FeedbackItem[];
  savedAt: string;
};
