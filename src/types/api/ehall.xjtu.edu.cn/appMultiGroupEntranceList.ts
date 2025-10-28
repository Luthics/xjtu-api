export interface RollGroup {
  groupId: string;
  groupName: string;
  targetUrl: string;
}

export interface RollResponse {
  data: {
    groupList: RollGroup[];
  };
}