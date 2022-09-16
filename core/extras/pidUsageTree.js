import pidtree from 'pidtree';
import pidusage from 'pidusage';

export default async (pid) => {
    const pids = await pidtree(pid);
    return await pidusage([pid, ...pids]);
};
