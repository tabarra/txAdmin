module.exports = (results) => {
    const byRuleId = results.reduce(
        (map, current) => {
            current.messages.forEach(({ ruleId, line, column }) => {
                if (!map[ruleId]) {
                    map[ruleId] = [];
                }

                const occurrence = `${current.filePath}:${line}:${column}`;
                map[ruleId].push(occurrence);
            });
            return map;
        }, {},
    );

    const ruleCounts = Object.entries(byRuleId)
        .map((rule) => ({id: rule[0], count: rule[1].length}));

    ruleCounts.sort((a, b) => {
        if (a.count > b.count) return -1;
        if (a.count < b.count) return 1;
        return 0;
    });

    return ruleCounts
        .map((rule) => `${rule.count}\t${rule.id}`)
        .join('\n');
};
