using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;

namespace ChoirApp.Infrastructure.Services;

public class MasterSongService : IMasterSongService
{
    private readonly ApplicationDbContext _context;

    public MasterSongService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<MasterSongDto>> CreateMasterSongAsync(CreateMasterSongDto createMasterSongDto)
    {
        try
        {
            var masterSong = new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = createMasterSongDto.Title,
                Artist = createMasterSongDto.Artist,
                LyricsChordPro = createMasterSongDto.LyricsChordPro
            };

            await _context.MasterSongs.AddAsync(masterSong);

            foreach (var tagName in createMasterSongDto.Tags)
            {
                var normalizedTagName = tagName.ToLower().Trim();
                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.TagName == normalizedTagName);
                if (tag == null)
                {
                    tag = new Tag { TagId = Guid.NewGuid(), TagName = normalizedTagName };
                    await _context.Tags.AddAsync(tag);
                }

                var songTag = new SongTag { SongId = masterSong.SongId, TagId = tag.TagId };
                await _context.SongTags.AddAsync(songTag);
            }

            await _context.SaveChangesAsync();

            return await GetMasterSongByIdAsync(masterSong.SongId);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<IEnumerable<MasterSongDto>>> GetAllMasterSongsAsync()
    {
        try
        {
            var songs = await _context.MasterSongs
                .Select(s => new MasterSongDto
                {
                    SongId = s.SongId,
                    Title = s.Title,
                    Artist = s.Artist,
                    LyricsChordPro = s.LyricsChordPro,
                    Tags = s.SongTags
                        .Select(st => st.Tag)
                        .Where(t => t != null)
                        .Select(t => new TagDto
                        {
                            TagId = t!.TagId,
                            TagName = t!.TagName
                        }).ToList()
                })
                .ToListAsync();

            return Result.Ok<IEnumerable<MasterSongDto>>(songs);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<MasterSongDto>> GetMasterSongByIdAsync(Guid id)
    {
        try
        {
            var songDto = await _context.MasterSongs
                .Where(s => s.SongId == id)
                .Select(s => new MasterSongDto
                {
                    SongId = s.SongId,
                    Title = s.Title,
                    Artist = s.Artist,
                    LyricsChordPro = s.LyricsChordPro,
                    Tags = s.SongTags
                        .Select(st => st.Tag)
                        .Where(t => t != null)
                        .Select(t => new TagDto
                        {
                            TagId = t!.TagId,
                            TagName = t!.TagName
                        }).ToList()
                })
                .FirstOrDefaultAsync();

            if (songDto == null)
            {
                return Result.Fail("Master song not found.");
            }

            return Result.Ok(songDto);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }
    
    public async Task<Result<MasterSongDto>> AddTagToSongAsync(Guid songId, string tagName)
    {
        try
        {
            var song = await _context.MasterSongs.FindAsync(songId);
            if (song == null)
            {
                return Result.Fail("Master song not found.");
            }

            var normalizedTagName = tagName.ToLower().Trim();
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.TagName == normalizedTagName);
            if (tag == null)
            {
                tag = new Tag { TagId = Guid.NewGuid(), TagName = normalizedTagName };
                await _context.Tags.AddAsync(tag);
            }

            var songTagExists = await _context.SongTags.AnyAsync(st => st.SongId == songId && st.TagId == tag.TagId);
            if (!songTagExists)
            {
                var songTag = new SongTag { SongId = song.SongId, TagId = tag.TagId };
                await _context.SongTags.AddAsync(songTag);
                await _context.SaveChangesAsync();
            }

            return await GetMasterSongByIdAsync(songId);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<bool>> RemoveTagFromSongAsync(Guid songId, Guid tagId)
    {
        try
        {
            var songTag = await _context.SongTags.FirstOrDefaultAsync(st => st.SongId == songId && st.TagId == tagId);
            if (songTag == null)
            {
                return Result.Fail("Tag not found on song.");
            }

            _context.SongTags.Remove(songTag);
            await _context.SaveChangesAsync();

            return Result.Ok(true);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }

    public async Task<Result<IEnumerable<MasterSongDto>>> SearchSongsAsync(string? title, string? artist, string? tag)
    {
        try
        {
            var query = _context.MasterSongs.AsQueryable();

            if (!string.IsNullOrEmpty(title))
            {
                query = query.Where(s => s.Title.Contains(title));
            }

            if (!string.IsNullOrEmpty(artist))
            {
                query = query.Where(s => s.Artist != null && s.Artist.Contains(artist));
            }

            if (!string.IsNullOrEmpty(tag))
            {
                var normalizedTag = tag.ToLower().Trim();
                query = query.Where(s => s.SongTags.Any(st => st.Tag != null && st.Tag.TagName == normalizedTag));
            }

            var songs = await query
                .Select(s => new MasterSongDto
                {
                    SongId = s.SongId,
                    Title = s.Title,
                    Artist = s.Artist,
                    LyricsChordPro = s.LyricsChordPro,
                    Tags = s.SongTags
                        .Select(st => st.Tag)
                        .Where(t => t != null)
                        .Select(t => new TagDto
                        {
                            TagId = t!.TagId,
                            TagName = t!.TagName
                        }).ToList()
                })
                .ToListAsync();

            return Result.Ok<IEnumerable<MasterSongDto>>(songs);
        }
        catch (Exception ex)
        {
            return Result.Fail(new Error(ex.Message));
        }
    }
}
