import { validateOrReject } from 'class-validator';

export const validateOrRejectModel = async (
  model: any,
  ctor: { new (): any },
) => {
  if (model instanceof ctor === false) {
    throw new Error('Incorrect input data');
  }

  try {
    await validateOrReject(model);
  } catch (error) {
    throw new Error(error);
  }
};
