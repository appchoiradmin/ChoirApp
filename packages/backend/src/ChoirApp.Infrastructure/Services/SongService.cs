using ChoirApp.Application.Dtos;
using ChoirApp.Application.Services;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentResults;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Services
{
    public class SongService : ISongService
    {
        private readonly ApplicationDbContext _dbContext;

        public SongService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        }

        public async Task<Result<SongDto>> CreateSongAsync(string title, string? artist, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility)
        {
            var user = await _dbContext.Users.FindAsync(creatorId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            var songResult = Song.Create(title, artist, content, creatorId, visibility);
            if (songResult.IsFailed)
            {
                return Result.Fail(songResult.Errors);
            }

            var song = songResult.Value;
            await _dbContext.Songs.AddAsync(song);
            await _dbContext.SaveChangesAsync();

            return Result.Ok(await MapToSongDtoAsync(song));
        }

        public async Task<Result<SongDto>> CreateSongVersionAsync(Guid baseSongId, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility)
        {
            var baseSong = await _dbContext.Songs
                .Include(s => s.Creator)
                .FirstOrDefaultAsync(s => s.SongId == baseSongId);

            if (baseSong == null)
            {
                return Result.Fail("Base song not found.");
            }

            var user = await _dbContext.Users.FindAsync(creatorId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            var songResult = Song.CreateVersion(baseSong, content, creatorId, visibility);
            if (songResult.IsFailed)
            {
                return Result.Fail(songResult.Errors);
            }

            var song = songResult.Value;
            await _dbContext.Songs.AddAsync(song);
            await _dbContext.SaveChangesAsync();

            return Result.Ok(await MapToSongDtoAsync(song));
        }

        public async Task<Result<SongDto>> GetSongByIdAsync(Guid songId)
        {
            var song = await _dbContext.Songs
                .Include(s => s.Creator)
                .Include(s => s.Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Visibilities).ThenInclude(sv => sv.Choir)
                .FirstOrDefaultAsync(s => s.SongId == songId);

            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            return Result.Ok(await MapToSongDtoAsync(song));
        }

        public async Task<Result<List<SongDto>>> GetSongsByUserIdAsync(Guid userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            var songs = await _dbContext.Songs
                .Include(s => s.Creator)
                .Include(s => s.Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Visibilities).ThenInclude(sv => sv.Choir)
                .Where(s => s.CreatorId == userId)
                .ToListAsync();

            var songDtos = new List<SongDto>();
            foreach (var song in songs)
            {
                songDtos.Add(await MapToSongDtoAsync(song));
            }

            return Result.Ok(songDtos);
        }

        public async Task<Result<List<SongDto>>> GetSongsByChoirIdAsync(Guid choirId)
        {
            var choir = await _dbContext.Choirs.FindAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Get songs that are either:
            // 1. Public to all
            // 2. Public to choirs and specifically shared with this choir
            var songs = await _dbContext.Songs
                .Include(s => s.Creator)
                .Include(s => s.Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Visibilities).ThenInclude(sv => sv.Choir)
                .Where(s => s.Visibility == Domain.Entities.SongVisibilityType.PublicAll ||
                           (s.Visibility == Domain.Entities.SongVisibilityType.PublicChoirs &&
                            s.Visibilities.Any(sv => sv.ChoirId == choirId)))
                .ToListAsync();

            var songDtos = new List<SongDto>();
            foreach (var song in songs)
            {
                songDtos.Add(await MapToSongDtoAsync(song));
            }

            return Result.Ok(songDtos);
        }

        public async Task<Result<List<SongDto>>> GetAllPublicSongsAsync()
        {
            var songs = await _dbContext.Songs
                .Include(s => s.Creator)
                .Include(s => s.Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Visibilities).ThenInclude(sv => sv.Choir)
                .Where(s => s.Visibility == Domain.Entities.SongVisibilityType.PublicAll)
                .ToListAsync();

            var songDtos = new List<SongDto>();
            foreach (var song in songs)
            {
                songDtos.Add(await MapToSongDtoAsync(song));
            }

            return Result.Ok(songDtos);
        }

        public async Task<Result<List<SongDto>>> SearchSongsAsync(string searchTerm, Guid? userId, Guid? choirId)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
            {
                return Result.Fail("Search term cannot be empty.");
            }

            var query = _dbContext.Songs
                .Include(s => s.Creator)
                .Include(s => s.Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Visibilities).ThenInclude(sv => sv.Choir)
                .AsQueryable();

            // Filter by visibility
            if (userId.HasValue)
            {
                // If user ID is provided, include songs created by that user
                query = query.Where(s => s.CreatorId == userId.Value ||
                                        s.Visibility == Domain.Entities.SongVisibilityType.PublicAll ||
                                        (s.Visibility == Domain.Entities.SongVisibilityType.PublicChoirs &&
                                         choirId.HasValue && s.Visibilities.Any(sv => sv.ChoirId == choirId.Value)));
            }
            else if (choirId.HasValue)
            {
                // If only choir ID is provided, include songs visible to that choir
                query = query.Where(s => s.Visibility == Domain.Entities.SongVisibilityType.PublicAll ||
                                        (s.Visibility == Domain.Entities.SongVisibilityType.PublicChoirs &&
                                         s.Visibilities.Any(sv => sv.ChoirId == choirId.Value)));
            }
            else
            {
                // If neither user ID nor choir ID is provided, include only public songs
                query = query.Where(s => s.Visibility == Domain.Entities.SongVisibilityType.PublicAll);
            }

            // Apply search term
            var normalizedSearchTerm = searchTerm.ToLower();
            var songs = await query
                .Where(s => s.Title.ToLower().Contains(normalizedSearchTerm) ||
                           (s.Artist != null && s.Artist.ToLower().Contains(normalizedSearchTerm)) ||
                           s.Content.ToLower().Contains(normalizedSearchTerm) ||
                           s.Tags.Any(t => t.Tag != null && t.Tag.TagName.ToLower().Contains(normalizedSearchTerm)))
                .ToListAsync();

            var songDtos = new List<SongDto>();
            foreach (var song in songs)
            {
                songDtos.Add(await MapToSongDtoAsync(song));
            }

            return Result.Ok(songDtos);
        }

        public async Task<Result<SongDto>> UpdateSongAsync(Guid songId, string title, string? artist, string content, Guid userId)
        {
            var song = await _dbContext.Songs.FindAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            var updateResult = song.Update(title, artist, content, userId);
            if (updateResult.IsFailed)
            {
                return Result.Fail(updateResult.Errors);
            }

            await _dbContext.SaveChangesAsync();
            return Result.Ok(await MapToSongDtoAsync(song));
        }

        public async Task<Result> UpdateSongVisibilityAsync(Guid songId, Domain.Entities.SongVisibilityType visibility, Guid userId)
        {
            var song = await _dbContext.Songs.FindAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            var updateResult = song.UpdateVisibility(visibility, userId);
            if (updateResult.IsFailed)
            {
                return Result.Fail(updateResult.Errors);
            }

            await _dbContext.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result> AddSongVisibilityToChoirAsync(Guid songId, Guid choirId, Guid userId)
        {
            var song = await _dbContext.Songs.FindAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            if (song.CreatorId != userId)
            {
                return Result.Fail("Only the creator can modify song visibility.");
            }

            var choir = await _dbContext.Choirs.FindAsync(choirId);
            if (choir == null)
            {
                return Result.Fail("Choir not found.");
            }

            // Check if visibility already exists
            var existingVisibility = await _dbContext.SongVisibilities
                .FirstOrDefaultAsync(sv => sv.SongId == songId && sv.ChoirId == choirId);

            if (existingVisibility != null)
            {
                return Result.Fail("Song is already visible to this choir.");
            }

            var songVisibility = new SongVisibility
            {
                SongId = songId,
                ChoirId = choirId
            };

            await _dbContext.SongVisibilities.AddAsync(songVisibility);
            await _dbContext.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> RemoveSongVisibilityFromChoirAsync(Guid songId, Guid choirId, Guid userId)
        {
            var song = await _dbContext.Songs.FindAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            if (song.CreatorId != userId)
            {
                return Result.Fail("Only the creator can modify song visibility.");
            }

            var songVisibility = await _dbContext.SongVisibilities
                .FirstOrDefaultAsync(sv => sv.SongId == songId && sv.ChoirId == choirId);

            if (songVisibility == null)
            {
                return Result.Fail("Song is not visible to this choir.");
            }

            _dbContext.SongVisibilities.Remove(songVisibility);
            await _dbContext.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> AddTagToSongAsync(Guid songId, string tagName)
        {
            var song = await _dbContext.Songs.FindAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            // Get or create tag
            var tag = await _dbContext.Tags.FirstOrDefaultAsync(t => t.TagName == tagName);
            if (tag == null)
            {
                tag = new Tag { TagId = Guid.NewGuid(), TagName = tagName };
                await _dbContext.Tags.AddAsync(tag);
            }

            // Check if tag is already associated with the song
            var existingTag = await _dbContext.SongTags
                .FirstOrDefaultAsync(st => st.SongId == songId && st.TagId == tag.TagId);

            if (existingTag != null)
            {
                return Result.Fail("Tag is already associated with this song.");
            }

            var songTag = new SongTag
            {
                SongId = songId,
                TagId = tag.TagId
            };

            await _dbContext.SongTags.AddAsync(songTag);
            await _dbContext.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> RemoveTagFromSongAsync(Guid songId, Guid tagId)
        {
            var songTag = await _dbContext.SongTags
                .FirstOrDefaultAsync(st => st.SongId == songId && st.TagId == tagId);

            if (songTag == null)
            {
                return Result.Fail("Tag is not associated with this song.");
            }

            _dbContext.SongTags.Remove(songTag);
            await _dbContext.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result> DeleteSongAsync(Guid songId, Guid userId)
        {
            var song = await _dbContext.Songs
                .Include(s => s.Derivatives)
                .FirstOrDefaultAsync(s => s.SongId == songId);

            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            if (song.CreatorId != userId)
            {
                return Result.Fail("Only the creator can delete this song.");
            }

            if (song.Derivatives.Any())
            {
                return Result.Fail("Cannot delete a song that has derivative versions.");
            }

            // Remove song tags
            var songTags = await _dbContext.SongTags
                .Where(st => st.SongId == songId)
                .ToListAsync();

            _dbContext.SongTags.RemoveRange(songTags);

            // Remove song visibilities
            var songVisibilities = await _dbContext.SongVisibilities
                .Where(sv => sv.SongId == songId)
                .ToListAsync();

            _dbContext.SongVisibilities.RemoveRange(songVisibilities);

            // Remove song
            _dbContext.Songs.Remove(song);
            await _dbContext.SaveChangesAsync();

            return Result.Ok();
        }

        public async Task<Result<IEnumerable<TagDto>>> GetAllTagsAsync()
        {
            try
            {
                var tags = await _dbContext.Tags
                    .OrderBy(t => t.TagName)
                    .Select(t => new TagDto
                    {
                        TagId = t.TagId,
                        TagName = t.TagName
                    })
                    .ToListAsync();

                return Result.Ok<IEnumerable<TagDto>>(tags);
            }
            catch (Exception ex)
            {
                return Result.Fail($"Failed to retrieve tags: {ex.Message}");
            }
        }

        private async Task<SongDto> MapToSongDtoAsync(Song song)
        {
            // Ensure related entities are loaded
            if (!_dbContext.Entry(song).Collection(s => s.Tags).IsLoaded)
            {
                await _dbContext.Entry(song).Collection(s => s.Tags).LoadAsync();
                foreach (var tag in song.Tags)
                {
                    await _dbContext.Entry(tag).Reference(t => t.Tag).LoadAsync();
                }
            }

            if (!_dbContext.Entry(song).Collection(s => s.Visibilities).IsLoaded)
            {
                await _dbContext.Entry(song).Collection(s => s.Visibilities).LoadAsync();
                foreach (var visibility in song.Visibilities)
                {
                    await _dbContext.Entry(visibility).Reference(v => v.Choir).LoadAsync();
                }
            }

            if (!_dbContext.Entry(song).Reference(s => s.Creator).IsLoaded)
            {
                await _dbContext.Entry(song).Reference(s => s.Creator).LoadAsync();
            }

            // Map domain SongVisibilityType to DTO SongVisibilityType
            var dtoVisibility = (Application.Dtos.SongVisibilityType)(int)song.Visibility;

            var songDto = new SongDto
            {
                SongId = song.SongId,
                Title = song.Title,
                Artist = song.Artist,
                Content = song.Content,
                CreatorId = song.CreatorId,
                CreatorName = song.Creator?.Name ?? "Unknown",
                CreatedAt = song.CreatedAt,
                VersionNumber = song.VersionNumber,
                BaseSongId = song.BaseSongId,
                Visibility = dtoVisibility,
                VisibleToChoirs = song.Visibilities
                    .Where(sv => sv.Choir != null)
                    .Select(sv => new ChoirDto
                    {
                        Id = sv.Choir!.ChoirId,
                        Name = sv.Choir.ChoirName,
                        AdminId = sv.Choir.AdminUserId
                    })
                    .ToList(),
                Tags = song.Tags
                    .Where(st => st.Tag != null)
                    .Select(st => new TagDto
                    {
                        TagId = st.Tag!.TagId,
                        TagName = st.Tag.TagName
                    })
                    .ToList()
            };

            return songDto;
        }
    }
}
