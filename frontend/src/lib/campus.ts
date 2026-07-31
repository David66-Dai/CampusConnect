/** 单校部署：全站统一校名，用户不再自行填写学校。 */
export const CAMPUS_NAME =
  process.env.NEXT_PUBLIC_CAMPUS_NAME?.trim() || "本校";
