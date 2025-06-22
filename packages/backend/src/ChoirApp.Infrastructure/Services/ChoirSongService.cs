using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ChoirApp.Infrastructure.Services;

public class ChoirSongService : IChoirSongService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChoirSongService> _logger;

    public ChoirSongService(ApplicationDbContext context, ILogger<ChoirSongService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Result<ChoirSongVersionDto>> CreateChoirSongVersionAsync(Guid choirId, Guid userId, CreateChoirSongVersionDto createDto)
    {
        try
        {
            var masterSongExists = await _context.MasterSongs.AnyAsync(ms => ms.SongId == createDto.MasterSongId);
            if (!masterSongExists)
            {
                return Result.Fail("Master song not found.");
            }

            var choirExists = await _context.Choirs.AnyAsync(c => c.ChoirId == choirId);
            if (!choirExists)
            {
                return Result.Fail("Choir not found.");
            }

            var choirSongVersion = new ChoirSongVersion
            {
                ChoirSongId = Guid.NewGuid(),
                MasterSongId = createDto.MasterSongId,
                ChoirId = choirId,
                EditedLyricsChordPro = createDto.EditedLyricsChordPro,
                LastEditedDate = DateTimeOffset.UtcNow,
                EditorUserId = userId
            };

            await _context.ChoirSongVersions.AddAsync(choirSongVersion);
            await _context.SaveChangesAsync();

            return await GetChoirSongVersionByIdAsync(choirId, choirSongVersion.ChoirSongId);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<IEnumerable<ChoirSongVersionDto>>> GetChoirSongVersionsAsync(Guid choirId)
    {
        try
        {
            var songs = await _context.ChoirSongVersions
            .Where(csv => csv.ChoirId == choirId)
            .Select(csv => new ChoirSongVersionDto
            {
                ChoirSongId = csv.ChoirSongId,
                MasterSongId = csv.MasterSongId,
                ChoirId = csv.ChoirId,
                EditedLyricsChordPro = csv.EditedLyricsChordPro,
                LastEditedDate = csv.LastEditedDate,
                EditorUserId = csv.EditorUserId,
                MasterSong = csv.MasterSong == null ? null : new MasterSongDto
                {
                    SongId = csv.MasterSong.SongId,
                    Title = csv.MasterSong.Title,
                    Artist = csv.MasterSong.Artist,
                    LyricsChordPro = csv.MasterSong.LyricsChordPro,
                    Tags = csv.MasterSong.SongTags.Where(st => st.Tag != null).Select(st => new TagDto
                    {
                        TagId = st.Tag!.TagId,
                        TagName = st.Tag!.TagName
                    }).ToList()
                }
            })
            .ToListAsync();

            return Result.Ok<IEnumerable<ChoirSongVersionDto>>(songs);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<ChoirSongVersionDto>> GetChoirSongVersionByIdAsync(Guid choirId, Guid songId)
    {
        try
        {
            var song = await _context.ChoirSongVersions
            .Where(csv => csv.ChoirId == choirId && csv.ChoirSongId == songId)
            .Select(csv => new ChoirSongVersionDto
            {
                ChoirSongId = csv.ChoirSongId,
                MasterSongId = csv.MasterSongId,
                ChoirId = csv.ChoirId,
                EditedLyricsChordPro = csv.EditedLyricsChordPro,
                LastEditedDate = csv.LastEditedDate,
                EditorUserId = csv.EditorUserId,
                MasterSong = csv.MasterSong == null ? null : new MasterSongDto
                {
                    SongId = csv.MasterSong.SongId,
                    Title = csv.MasterSong.Title,
                    Artist = csv.MasterSong.Artist,
                    LyricsChordPro = csv.MasterSong.LyricsChordPro,
                    Tags = csv.MasterSong.SongTags.Where(st => st.Tag != null).Select(st => new TagDto
                    {
                        TagId = st.Tag!.TagId,
                        TagName = st.Tag!.TagName
                    }).ToList()
                }
            })
            .FirstOrDefaultAsync();

            if (song == null)
            {
                return Result.Fail("Choir song version not found.");
            }

            return Result.Ok(song);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<ChoirSongVersionDto>> UpdateChoirSongVersionAsync(Guid choirId, Guid songId, UpdateChoirSongVersionDto updateDto)
    {
        _logger.LogInformation("Attempting to update ChoirSongVersion. ChoirId: {ChoirId}, ChoirSongId: {ChoirSongId}", choirId, songId);

        var count = await _context.ChoirSongVersions.CountAsync();
        _logger.LogInformation("Total ChoirSongVersions in DB: {Count}", count);
        var choirSongVersion = await _context.ChoirSongVersions
            .FirstOrDefaultAsync(csv => csv.ChoirId == choirId && csv.ChoirSongId == songId);

        if (choirSongVersion == null)
        {
            _logger.LogWarning("ChoirSongVersion not found. ChoirId: {ChoirId}, ChoirSongId: {ChoirSongId}", choirId, songId);
            return Result.Fail("Choir song version not found.");
        }

        _logger.LogInformation("ChoirSongVersion found. Updating properties.");

        choirSongVersion.EditedLyricsChordPro = updateDto.EditedLyricsChordPro;
        choirSongVersion.LastEditedDate = DateTimeOffset.UtcNow;
        choirSongVersion.EditorUserId = updateDto.EditorUserId;

        await _context.SaveChangesAsync();

        return await GetChoirSongVersionByIdAsync(choirId, songId);
    }
}
