// frontend/src/types/device-testing.d.ts

import { DeviceStatus } from "./devices"; // Assuming DeviceStatus is defined
import { testResultEnum } from "@/../backend/src/db/schema"; // Import enum values from backend schema directly

export type TestResult = z.infer<typeof testResultEnum>;

export type DeviceTest = {
  id: string;
  deviceId: string;
  authCode?: string | null;
  handedTo: string;
  testDate: string;
  result?: TestResult | null;
  notes?: string | null;
  createdAt: string;
};

export type StartDeviceTestDto = {
  deviceId: string;
  handedTo: string;
  authCode?: string;
};

export type CompleteDeviceTestDto = {
  testId: string;
  result: TestResult;
  notes?: string;
};
