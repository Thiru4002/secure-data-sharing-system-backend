exports.success = (res, statusCode, data, message = '') => {
  res.status(statusCode).json({
    status: 'success',
    data,
    message,
  });
};

exports.error = (res, statusCode, message) => {
  res.status(statusCode).json({
    status: 'error',
    message,
  });
};

exports.loginSuccess = (res, statusCode, token, user) => {
  res.status(statusCode).json({
    status: 'success',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
  });
};
