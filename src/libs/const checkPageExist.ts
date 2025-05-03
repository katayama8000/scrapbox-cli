export const checkPageExist = async (
    projectName: string,
    title: string,
): Promise<boolean> => {
    const { checkPageExist } = (await import("@katayama8000/cosense-client")).CosenseClient(projectName);
    return await checkPageExist(title);
};