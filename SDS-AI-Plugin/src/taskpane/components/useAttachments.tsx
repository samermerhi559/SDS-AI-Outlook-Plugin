// hooks/useAttachments.ts
import { useCallback, useEffect, useState } from "react";
import { Attachment } from "../types/Attachment";

export const useAttachments = (initialAttachments: Attachment[], showAll: boolean) => {
  const [attachments, setAttachments] = useState<Attachment[]>(() =>
    Array.isArray(initialAttachments) ? initialAttachments : []
  );
  const [loading, setLoading] = useState<boolean>(initialAttachments.length === 0);

  // ⚙️ Automatically stop loading if attachments are already populated
  useEffect(() => {
    if (loading && attachments.length > 0) {
      console.log("📦 useAttachments.tsx: Auto-disabling loading — attachments present.");
      setLoading(false);
    }
  }, [loading, attachments]);

  const filteredAttachments = showAll
    ? attachments
    : attachments.filter((att) => att.name.toLowerCase().endsWith(".pdf"));

  const setAttachmentsAndLoad = useCallback((newAttachments: Attachment[]) => {
    console.log("📦 useAttachments.tsx: setAttachmentsAndLoad called:", newAttachments.length);
    setAttachments(newAttachments);
    setLoading(false);
  }, []);

  return {
    loading,
    filteredAttachments,
    setAttachments: setAttachmentsAndLoad,
  };
};
