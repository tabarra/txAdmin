# Recipe Files
A Recipe is a YAML document that describes how to deploy a server properly: from downloading resources, to configuring the `server.cfg` file.  
You can run a recipe from txAdmin's built-in Server Deployer.  
Recipes will be "jailed" to the target folder, so for example they won't be able to execute `write_file` to your `admins.json`.  
At the end of the deployment process, your target folder will be checked for the presence of a `server.cfg` and a `resources` folder to make sure everything went correctly.  
On the setup page you will be able to import a recipe via its URL or by selecting one of the recommended ones from the community.  
  
Example recipe:
```yaml
name: PlumeESX2
version: v1.2.3
author: Toybarra
description: A full featured (8 jobs) and highly configurable yet lightweight ESX v2 base that can be easily extendable. 

variables:
    dbHost: localhost
    dbUsername: root
    dbPassword: ""
    dbName: null

tasks: 
    - action: download_file
      url: https://github.com/citizenfx/cfx-server-data/archive/master.zip
      path: ./tmp/cfx-server-data.zip

    - action: another_task
      optionA: aaaa
      optionB: bbbbbb
```


## Meta Data
The recipe accepts the following default meta data:
- Engine specific meta data *(optional)*:
  - `$engine`: The recipe's target engine version.
  - `$minFxVersion`: The minimum required FXserver version for this recipe.
  - `$onesync`: The required onesync value to be set after deployment. Supports only `off`, `legacy`, `on` - just as FXServer.
- General tags *(strongly-recommended)*:
  - `name`: The short name for your recipe. Recommended to be under 24 characters.
  - `version`: The version of your recipe.
  - `author`: The short name of the author. Recommended to be under 24 characters.
  - `description`: A single or multiline description for your recipe. Recommended to be under 256 characters. On YAML you can use multiline strings in many ways, for more information check https://yaml-multiline.info.


## Context Variables
The deployer has a shared context between tasks, and they are initially populated by the `variables` and the deployer step 2 (user input) which is used by things like database configuration and string replacements.  
Default variables:
- `deploymentID`: composed by the shortened recipe name with a hex timestamp which will look something like `PlumeESX_BBC957`.
- `serverName`: The name of the server specified in the setup page.
- `recipeName`, `recipeAuthor`, `recipeVersion`, `recipeDescription`: Populated from the recipe metadata, if available.
- `dbHost`, `dbPort`, `dbUsername`, `dbPassword`, `dbName`, `dbDelete`, `dbConnectionString`: Populated from the database configuration user input, if available.
- `svLicense`: Required variable, inputed in the deployer step 2. The deployer will automatically replace `{{svLicense}}` in the `server.cfg` at the end of the deployment.
- `serverEndpoints`: The `endpoint_add_xxxx` for the server. The deployer will set this with the defaults (`0.0.0.0:30120`) or using the appropriate ZAP-Hosting configuration.
- `maxClients`: The number of max clients for the server. The deployer will set this with the default 48 slots or using the appropriate ZAP-Hosting configuration.
  
In the second step of the deployer, the user will be asked to fill some information required to configure his server which will be loaded into context variables.  
How to set custom variables:
```yaml
variables: 
    aaa: bbbb
    ccc: dddd
```
  

## Tasks
Tasks/actions are executed sequentially, and any failure in the chain stops the process.  
Attention: careful with the number of spaces used in the indentation.  
Every task can contain a `timeoutSeconds` option to increase it's defautl value.

**Available Actions:**
- [download_github](#download_github)
- [download_file](#download_file)
- [unzip](#unzip)
- [move_path](#move_path)
- [copy_path](#copy_path)
- [remove_path](#remove_path)
- [ensure_dir](#ensure_dir)
- [write_file](#write_file)
- [replace_string](#replace_string)
- [connect_database](#connect_database)
- [query_database](#query_database)
- [load_vars](#load_vars)

### `download_github`
Downloads a GitHub repository with an optional reference (branch, tag, commit hash) or subpath.  
If the directory structure does not exist, it is created.
- `src`: The repository to be downloaded. This can be an URL or `repo_owner/repo_name`.
- `ref`: *(optional)* The git reference to be downloaded. This can be a branch, a tag, or a commit hash. If none is set, the recipe engine will query GitHub's API to get the default branch name (usually `master` or `main`).
- `subpath`: *(optional)* When specified, copies a subpath of the repository.
- `dest`: The destination path for the downloaded file.
> Note: If you have more than 30 of this action, it is recommended to set the ref, otherwise users will may end up getting download errors (401/403 instead of 429) due to the number of times txAdmin calls the GitHub API.
```yaml
# Example with subpath and reference
- action: download_github
  src: https://github.com/citizenfx/cfx-server-data
  ref: 6eaa3525a6858a83546dc9c4ce621e59eae7085c
  subpath: resources
  dest: ./resources

# Simple example
- action: download_github
  src: esx-framework/es_extended
  dest: ./resources/[esx]/es_extended
```

### `download_file`
Downloads a file to a specific path.  
- `url`: The URL of the file.
- `path`: The destination path for the downloaded file. This must be a file name and not a path.
```yaml
- action: download_file
  url: https://github.com/citizenfx/cfx-server-data/archive/master.zip
  path: ./tmp/cfx-server-data.zip
```

### `unzip`
Extracts a ZIP file to a target folder. This will not work for tar files.  
- `src`: The source path.
- `dest`: The destination path.
```yaml
- action: unzip
  src: ./tmp/cfx-server-data.zip
  dest: ./tmp
```

### `move_path`
Moves a file or directory. The directory can have contents.
This is an implementation of [fs-extra.move()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/move.md).
- `src`: The source path. This can be either a file or a folder. Cannot be the root path (`./`).
- `dest`: The destination path. Cannot be the root path (`./`).
- `overwrite`: *(optional, boolean)* When set to true, it will replace the destination path if it already exists.
```yaml
- action: move_path
  src: ./tmp/cfx-server-data-master/resources
  dest: ./resources
  overwrite: true
```

### `copy_path`
Copy a file or directory. The directory can have contents.
This is an implementation of [fs-extra.copy()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/copy.md).
- `src`: The source path. Note that if `src` is a directory it will copy everything inside of this directory, not the entire directory itself.
- `dest`: The destination path. Note that if `src` is a file, `dest` cannot be a directory.
- `overwrite`: *(optional, boolean)* When set to `true`, overwrite existing file or directory, default is `true`. Note that the copy operation will silently fail if you set this to `false` and the destination exists. Use the `errorOnExist` option to change this behavior.
- `errorOnExist`: *(optional, boolean)* When overwrite is `false` and the destination exists, throw an error. Default is `false`.
```yaml
- action: copy_path
  src: ./tmp/cfx-server-data-master/resources/
  dest: ./resources
```

### `remove_path`
Removes a file or directory. The directory can have contents. If the path does not exist, silently does nothing.
This is an implementation of [fs-extra.remove()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/remove.md).
- `path`: The path to be removed. Cannot be the root path (`./`).
```yaml
- action: remove_path
  path: ./tmp
```

### `ensure_dir`
Ensures that the directory exists. If the directory structure does not exist, it is created.
This is an implementation of [fs-extra.ensureDir()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/ensureDir.md).
- `path`: The path to be created. Cannot be the root path (`./`).
```yaml
- action: ensure_dir
  path: ./resources
```

### `write_file`
Writes or appends data to a file. If not in the append mode, the file will be overwritten and the directory structure will be created if it doesn't exists.
This is an implementation of [fs-extra.outputFile()](https://github.com/jprichardson/node-fs-extra/blob/HEAD/docs/outputFile.md) and Node's default `fs.appendFile()`.
- `file`: The path of the file to be written to.
- `append`: *(optional, boolean)* When set to true, the data will be appended to the end of the target file instead of overwriting everything.
- `data`: The data to be written to the target path.
```yaml
# Append example
- action: write_file
  file: ./server.cfg
  append: true
  data: |
    ensure example1
    ensure example2

# Write file example
- action: write_file
  file: ./doesntexist/config.json
  data: |
    {
        "someVariable": true,
        "heyLookAnArray": [123, 456]
    }
```

### `replace_string`
Replaces a string in the target file or files array based on a search string and/or context variables.
- `file`: String or array containing the file(s) to be checked for the replacer string.
- `mode`: *(optional)* Specify the behavior of the replacer.
  - `template`: *(default)* The `replace` string option processed for context variables in the `{{varName}}` format.
  - `all_vars`: All variables (`{{varName}}`) will be replaced in the target file. The `search` and `replace` options will be ignored.
  - `literal`: Normal string search/replace without any vars
- `search`: The String to be searched for.
- `replace`: The String that will replace the `search` one.
```yaml
# Single file - template mode is implicit
- action: replace_string
  file: ./server.cfg
  search: 'FXServer, but unconfigured'
  replace: '{{serverName}} built with {{recipeName}} by {{recipeAuthor}}!'

# Multiple files
- action: replace_string
  mode: all_vars
  file: 
    - ./resources/blah.cfg
    - ./something/config.json

# Replace all variables
- action: replace_string
  file: ./configs.cfg
  search: 'omg_replace_this'
  replace: 'got_it!'
```

### `connect_database`
Connects to a MySQL/MariaDB server and creates a database if the dbName variable is null.  
You need to execute this action before the `query_database` to prepare the deployer context.  
This action does not have any direct attributes attached to it. Instead it uses Context Variables set in the deployer step 2 (user input).
```yaml
# Yes, that's just it
- action: connect_database
```

### `query_database`
Runs a SQL query in the previously connected database.  
This query can be a file path **OR** a string, but not both at the same time!  
You need to execute the `connect_database` before this action.
- `file`: The path of the SQL file to be executed.
- `query`: The query string to be executed.
```yaml
# Running a query from a file
- action: query_database
  file: ./tmp/create_tables.sql

# Running a query from a string
- action: query_database
  query: |
    CREATE TABLE IF NOT EXISTS `users` (
        `id` int(10) unsigned NOT NULL,
        `name` tinytext NOT NULL
    );
    INSERT INTO `users` (`name`) VALUES ('tabarra');
```

### `load_vars`
Loads variables from a JSON file to the deployer context.
- `src`: The path of the JSON file to be loaded.
```yaml
- action: load_vars
  src: ./toload.json
```
