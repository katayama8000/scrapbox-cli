export const checkPageExist = async (
  projectName: string,
  title: string,
): Promise<boolean> => {
  try {
    const { checkPageExist } = (
      await import("@katayama8000/cosense-client")
    ).CosenseClient(projectName);
    return await checkPageExist(title);
  } catch (error) {
    console.error("checkPageExist error:", error);
    return false;
  }
};
