/**
 * Utility functions for password hashing and verification using bcryptjs.
 * NOTE: abstracting here because in the future these options should not really be called from
 * outside of this module, be that a static method or part of the user class instance.
 * 
 * NOTE: Benchmark comnparison between native fxserver and bcryptjs:
 *   https://gist.github.com/tabarra/87a84faf689bb6a0eb8c01d5a7e73ed1
 */
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 11; // matches native fxserver

export const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const verifyPassword = (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const hashPasswordSync = (password: string): string => {
    return bcrypt.hashSync(password, BCRYPT_ROUNDS);
};

export const verifyPasswordSync = (password: string, hash: string): boolean => {
    return bcrypt.compareSync(password, hash);
};
