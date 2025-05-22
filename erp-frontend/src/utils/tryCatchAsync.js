//create a super function trycatch
export const tryCatch = async (func) => {
  try {
    return await func();
  } catch (error) {
    console.error('API Error:', error);
    throw error; // Rethrow the error so it can be handled by the calling code
  }
};