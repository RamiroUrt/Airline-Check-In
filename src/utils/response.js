export const successResponse = (data) => ({
  code: 200,
  data: data
});

export const notFoundResponse = () => ({
  code: 404,
  data: {}
});

export const errorResponse = (message) => ({
  code: 400,
  errors: message
});