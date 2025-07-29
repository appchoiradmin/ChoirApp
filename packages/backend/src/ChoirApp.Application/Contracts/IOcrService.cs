using FluentResults;

namespace ChoirApp.Application.Contracts;

public interface IOcrService
{
    /// <summary>
    /// Extracts text from an image file and converts it to ChordPro format
    /// </summary>
    /// <param name="imageStream">The image file stream</param>
    /// <param name="fileName">The original file name</param>
    /// <returns>Result containing the parsed ChordPro content</returns>
    Task<Result<string>> ParseImageToChordProAsync(Stream imageStream, string fileName);
    
    /// <summary>
    /// Extracts raw text from an image file using OCR
    /// </summary>
    /// <param name="imageStream">The image file stream</param>
    /// <param name="fileName">The original file name</param>
    /// <returns>Result containing the extracted text</returns>
    Task<Result<string>> ExtractTextFromImageAsync(Stream imageStream, string fileName);
}
