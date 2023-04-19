import { v4 as uuidv4, validate } from 'uuid';

export const generateUUID = () => uuidv4();
export const validateUUID = (uuid: string) => validate(uuid);
