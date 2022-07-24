// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

const vscode = require('vscode'); 
const fs = require('fs');
const path = require('path');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('cpp-class-helper is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('cpp-class-helper.initialize', function () {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		vscode.window.showInformationMessage('C++ Class Helper is activated!');

		//open file dialogs => src, include
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('cpp-class-helper.createClassContextMenu', function (){

		//Read source and include folder paths from configuration file
		let workspace_config = vscode.workspace.getConfiguration("cpp-class-helper");
		let src_folder_path = workspace_config.get("srcFolderPath");
		let include_folder_path = workspace_config.get("includeFolderPath");

		//If source or include folder path is null, ask user for new paths
		if(!src_folder_path || !include_folder_path)
		{
			vscode.window.showWarningMessage("Invalid source/header folder path. Please select source and header folders first.");
			return;
		}

		//Ask user for the class name
		getClassName().then(class_name => {
			if(class_name == undefined)
				return;

			//Create .cpp and .hpp files
			createClassFiles(src_folder_path, include_folder_path, class_name, workspace_config);
			
		});

	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('cpp-class-helper.updateFoldersContextMenu', function (){
		updateSourceFolders();
	});
	context.subscriptions.push(disposable);
	
}

// this method is called when your extension is deactivated
function deactivate() {
	console.log('cpp-class-helper is now deactive!');
}

module.exports = {
	activate,
	deactivate
}

function updateSourceFolders() {
	let workspace_config = vscode.workspace.getConfiguration("cpp-class-helper");
	let src_option_list = {canSelectMany:false, title:"Select src Folder", canSelectFiles:false, canSelectFolders:true, openLabel:"Select src Folder"};
	let include_option_list = {canSelectMany:false, title:"Select include Folder", canSelectFiles:false, canSelectFolders:true, openLabel:"Select include Folder"};

	vscode.window.showOpenDialog(src_option_list).then(function(uri_list){
		if(!uri_list)
			return;
		
		let src_folder = uri_list.at(0).fsPath;
		workspace_config.update("srcFolderPath", src_folder);
		// console.log(workspace_config.get("srcFolderPath"));
	});
	vscode.window.showOpenDialog(include_option_list).then(function(uri_list){
		if(!uri_list)
			return;
		
		let include_folder = uri_list.at(0).fsPath;
		workspace_config.update("includeFolderPath", include_folder);
		// console.log(workspace_config.get("includeFolderPath"));
	});
}

function getClassName(){
	let inputBoxOptions = {placeHolder: "Enter class name..."};
	return vscode.window.showInputBox(inputBoxOptions).then(className => {
		return className;
	});
}

function createClassFiles(src_folder_path, include_folder_path, class_name, workspace_config)
{
	console.log("fp");
	const src_fname = path.join(src_folder_path, class_name+".cpp");
	const include_fname = path.join(include_folder_path, class_name+".hpp");

	let header_file_content = workspace_config.get("headerFileDefaultValue").replaceAll("\$\{class_name\}", class_name);
	let source_file_content = workspace_config.get("sourceFileDefaultValue").replaceAll("\$\{class_name\}", class_name);

	fs.writeFile(include_fname, header_file_content, 'utf8', err => {
		if(err)
		{
			vscode.window.showErrorMessage("Error while creating header file.");
			vscode.window.showErrorMessage("Make sure you have the required file permissions and provide a class name which can be used as a valid filename.");
			return;
		}

		fs.writeFile(src_fname, source_file_content, 'utf8', err => {
			if(err)
			{
				vscode.window.showErrorMessage("Error while creating source file.");
				vscode.window.showErrorMessage("Make sure you have the required file permissions and provide a class name which can be used as a valid filename.");
				fs.rm(include_fname, err => {
					if(err)
						vscode.window.showErrorMessage("Failed to remove created include file. Please remove manually.");
				})
			}				
		});

	});
	
}