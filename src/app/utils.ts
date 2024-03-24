function shortenFilePath(filePath: string, maxLength: number = 45): string {
    if (filePath.length <= maxLength) {
      return filePath;
    }
    const separator = filePath.includes('/') ? '/' : '\\';
    const segments = filePath.split(separator);

    // Handle cases where path length is too short to be meaningfully shortened
    if (segments.length < 3) {
      return filePath.slice(0, maxLength - 3) + separator + '...';
    }

    let start = segments[0];
    let end = segments[segments.length - 1];

    // Include the leading separator for absolute paths
    if (filePath.startsWith(separator)) {
      start = separator + start;
    }

    let middle = '...';

    // Adjust according to the maximum length allowed
    const startMaxLength = Math.ceil((maxLength - middle.length - end.length) / 2);
    const endMaxLength = Math.floor((maxLength - middle.length - start.length) / 2);

    console.log(startMaxLength, endMaxLength);

    if (start.length > startMaxLength) {
      start = start.slice(0, startMaxLength - 1) + '…';
    }

    if (end.length > endMaxLength) {
      end = '…' + end.slice(-endMaxLength + 1);
    }

    // Reassemble the path using the determined separator
    return start + separator + middle + separator + end;
  }

  export { shortenFilePath };