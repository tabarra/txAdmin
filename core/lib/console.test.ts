import { suite, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processStdioWriteRaw, processStdioEnsureEol } from './console';


suite('processStdioWriteRaw & processStdioEnsureEol', () => {
    let writeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        writeSpy = vi.spyOn(process.stdout as any, 'write').mockImplementation(() => true);
    });
    
    afterEach(() => {
        writeSpy.mockRestore();
    });

    it('should write a non-newline string and then add a newline', () => {
        processStdioWriteRaw("Hello");
        expect(writeSpy).toHaveBeenCalledWith("Hello");
        processStdioEnsureEol();
        expect(writeSpy).toHaveBeenCalledWith('\n');
    });

    it('should write a string ending in newline without adding an extra one', () => {
        processStdioWriteRaw("Hello\n");
        expect(writeSpy).toHaveBeenCalledWith("Hello\n");
        writeSpy.mockClear();
        processStdioEnsureEol();
        expect(writeSpy).not.toHaveBeenCalled();
    });

    it('should write Uint8Array without trailing newline and then add one', () => {
        const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
        processStdioWriteRaw(buffer);
        expect(writeSpy).toHaveBeenCalledWith(buffer);
        processStdioEnsureEol();
        expect(writeSpy).toHaveBeenCalledWith('\n');
    });

    it('should write Uint8Array with trailing newline and not add an extra one', () => {
        const newline = 10;
        const buffer = new Uint8Array([72, 101, 108, 108, 111, newline]); // "Hello\n"
        processStdioWriteRaw(buffer);
        expect(writeSpy).toHaveBeenCalledWith(buffer);
        writeSpy.mockClear();
        processStdioEnsureEol();
        expect(writeSpy).not.toHaveBeenCalled();
    });
});
