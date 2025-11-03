"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PropertyForm, PropertyPayload } from "@/components/forms/PropertyForm";

export function AddPropertyModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: PropertyPayload) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: PropertyPayload) => {
    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Add a new property"
      open={open}
      onClose={onClose}
      footer={null}
    >
      <PropertyForm onSubmit={handleSubmit} submitting={loading} />
    </Modal>
  );
}
