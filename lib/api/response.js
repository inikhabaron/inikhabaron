import { NextResponse } from 'next/server';

/**
 * Success Response
 */
export function success(data = null, message = '', meta = null, status = 200) {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  return NextResponse.json(response, { status });
}

/**
 * Error Response
 */
export function failure(
  message = 'Something went wrong',
  status = 400,
  error = null
) {
  const response = {
    success: false,
    message,
  };

  if (error) {
    response.error = error;
  }

  return NextResponse.json(response, { status });
}