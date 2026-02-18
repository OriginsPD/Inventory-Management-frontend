// frontend/src/types/promotions.d.ts

export type Promotion = {
  id: string;
  deviceId: string;
  promotionType: string;
  promotionDate?: string | null;
  approvedBy: string;
  createdAt: string;
};

export type CreatePromotionDto = {
  deviceId: string;
  promotionType: string;
  promotionDate?: string;
  approvedBy: string;
};
