using FluentResults;

namespace ChoirApp.Application.Contracts;

public interface ISheetMusicTranscriptionService
{
    /// <summary>
    /// Converts a sheet music image directly to ChordPro format using AI vision
    /// </summary>
    /// <param name="imageStream">The sheet music image file stream</param>
    /// <param name="fileName">The original file name</param>
    /// <returns>Result containing the ChordPro formatted content</returns>
    Task<Result<string>> ConvertImageToChordProAsync(Stream imageStream, string fileName);
}
