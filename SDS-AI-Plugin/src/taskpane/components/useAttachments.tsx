// hooks/useAttachments.ts
import { useCallback, useState } from "react";
import { Attachment } from "../types/Attachment";

export const useAttachments = (initialAttachments: Attachment[], showAll: boolean) => {
  const [attachments, setAttachments] = useState<Attachment[]>(() => initialAttachments);
  const [loading, setLoading] = useState<boolean>(initialAttachments.length === 0);

  const filteredAttachments = showAll
    ? attachments
    : attachments.filter((att) => att.name.toLowerCase().endsWith(".pdf"));

  const setAttachmentsAndLoad = (newAttachments: Attachment[]) => {
    setAttachments(newAttachments);
    setLoading(false);
  };

  return {
    loading,
    filteredAttachments,
    setAttachments: setAttachmentsAndLoad,
  };
};