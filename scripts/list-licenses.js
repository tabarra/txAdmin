import fs from 'node:fs';
import chalk from 'chalk';

const packageJson = JSON.parse(fs.readFileSync('./package-lock.json', 'utf8'));

//Processing package-lock.json
const licenseUsage = new Map();
let packagesWithLicense = Object.keys(packageJson.packages).length;
for (const [packageName, packageData] of Object.entries(packageJson.packages)) {
    const licenseName = packageData.license;
    if (!licenseName) {
        packagesWithLicense--;
        console.log(chalk.yellow('No license found for package: ') + packageName);
    }
    const currCount = licenseUsage.get(licenseName) ?? 0;
    licenseUsage.set(licenseName, currCount + 1);
}

//Printing results
console.group(chalk.green(`--- Detected Licenses (${packagesWithLicense}) ---`));
const sortedLicenseUsage = [...licenseUsage.entries()]
    .sort((a, b) => a[0] - b[0]);
for (const [license, count] of sortedLicenseUsage) {
    console.log(
        license ? `${license}: ` : chalk.red('unknown: '),
        chalk.yellow(count)
    );
}
