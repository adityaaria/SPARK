export class InstallerError extends Error {
  constructor(message, code = 'INSTALLER_ERROR') {
    super(message);
    this.name = 'InstallerError';
    this.code = code;
  }
}
