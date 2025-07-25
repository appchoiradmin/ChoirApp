using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using System.Linq;

namespace ChoirApp.Application.Services
{
    public class SongService : ISongService
    {
        private readonly ISongRepository _songRepository;
        private readonly IUserRepository _userRepository;
        private readonly ITagRepository _tagRepository;

        public SongService(
            ISongRepository songRepository,
            IUserRepository userRepository,
            ITagRepository tagRepository)
        {
            _songRepository = songRepository;
            _userRepository = userRepository;
            _tagRepository = tagRepository;
        }

        public async Task<Result<SongDto>> CreateSongAsync(string title, string? artist, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility, List<Guid>? visibleToChoirs = null)
        {
            // Business rule: Creator must exist
            var user = await _userRepository.GetByIdAsync(creatorId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            // Create song using domain logic
            var songResult = Song.Create(title, artist, content, creatorId, visibility);
            if (songResult.IsFailed)
            {
                return Result.Fail(songResult.Errors);
            }

            var song = songResult.Value;
            await _songRepository.AddAsync(song);
            
            // If PublicChoirs visibility and choir IDs provided, create SongVisibility records
            if (visibility == Domain.Entities.SongVisibilityType.PublicChoirs && visibleToChoirs != null && visibleToChoirs.Any())
            {
                foreach (var choirId in visibleToChoirs)
                {
                    var addVisibilityResult = await AddSongVisibilityToChoirAsync(song.SongId, choirId, creatorId);
                    if (addVisibilityResult.IsFailed)
                    {
                        // Log the error but don't fail the entire operation
                        Console.WriteLine($"Warning: Failed to add song visibility to choir {choirId}: {string.Join(", ", addVisibilityResult.Errors.Select(e => e.Message))}");
                    }
                }
            }
            
            await _songRepository.SaveChangesAsync();

            return Result.Ok(MapToSongDto(song));
        }

        public async Task<Result<SongDto>> CreateSongVersionAsync(Guid baseSongId, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility, List<Guid>? visibleToChoirs = null)
        {
            // Business rule: Base song must exist
            var baseSong = await _songRepository.GetByIdAsync(baseSongId);
            if (baseSong == null)
            {
                return Result.Fail("Base song not found.");
            }

            // Business rule: Creator must exist
            var user = await _userRepository.GetByIdAsync(creatorId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            // Create version using domain logic
            var versionResult = Song.CreateVersion(baseSong, content, creatorId, visibility);
            if (versionResult.IsFailed)
            {
                return Result.Fail(versionResult.Errors);
            }

            var version = versionResult.Value;
            await _songRepository.AddAsync(version);
            
            // If PublicChoirs visibility and choir IDs provided, create SongVisibility records
            if (visibility == Domain.Entities.SongVisibilityType.PublicChoirs && visibleToChoirs != null && visibleToChoirs.Any())
            {
                foreach (var choirId in visibleToChoirs)
                {
                    var addVisibilityResult = await AddSongVisibilityToChoirAsync(version.SongId, choirId, creatorId);
                    if (addVisibilityResult.IsFailed)
                    {
                        // Log the error but don't fail the entire operation
                        Console.WriteLine($"Warning: Failed to add song version visibility to choir {choirId}: {string.Join(", ", addVisibilityResult.Errors.Select(e => e.Message))}");
                    }
                }
            }
            
            await _songRepository.SaveChangesAsync();

            return Result.Ok(MapToSongDto(version));
        }

        public async Task<Result<SongDto>> GetSongByIdAsync(Guid songId)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            return Result.Ok(MapToSongDto(song));
        }

        public async Task<Result<List<SongDto>>> GetSongsByUserIdAsync(Guid userId)
        {
            var songs = await _songRepository.GetByUserIdAsync(userId);
            return Result.Ok(songs.Select(MapToSongDto).ToList());
        }

        public async Task<Result<List<SongDto>>> GetSongsByChoirIdAsync(Guid choirId)
        {
            var songs = await _songRepository.GetByChoirIdAsync(choirId);
            return Result.Ok(songs.Select(MapToSongDto).ToList());
        }

        public async Task<Result<List<SongDto>>> GetAllPublicSongsAsync()
        {
            var songs = await _songRepository.GetAllPublicAsync();
            return Result.Ok(songs.Select(MapToSongDto).ToList());
        }

        public async Task<Result<List<SongDto>>> SearchSongsAsync(string searchTerm, Guid? userId, Guid? choirId)
        {
            var songs = await _songRepository.SearchAsync(searchTerm, userId, choirId);
            return Result.Ok(songs.Select(MapToSongDto).ToList());
        }

        public async Task<Result<SongDto>> UpdateSongAsync(Guid songId, string title, string? artist, string content, Guid userId)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            // Update using domain logic (includes authorization check)
            var updateResult = song.Update(title, artist, content, userId);
            if (updateResult.IsFailed)
            {
                return Result.Fail(updateResult.Errors);
            }

            await _songRepository.SaveChangesAsync();
            return Result.Ok(MapToSongDto(song));
        }

        public async Task<Result> UpdateSongVisibilityAsync(Guid songId, Domain.Entities.SongVisibilityType visibility, Guid userId)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            // Update using domain logic (includes authorization check)
            var updateResult = song.UpdateVisibility(visibility, userId);
            if (updateResult.IsFailed)
            {
                return Result.Fail(updateResult.Errors);
            }

            await _songRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public Task<Result> AddSongVisibilityToChoirAsync(Guid songId, Guid choirId, Guid userId)
        {
            // This functionality would need to be implemented in the domain
            // For now, return a placeholder
            return Task.FromResult(Result.Fail("Feature not yet implemented in domain layer."));
        }

        public Task<Result> RemoveSongVisibilityFromChoirAsync(Guid songId, Guid choirId, Guid userId)
        {
            // This functionality would need to be implemented in the domain
            // For now, return a placeholder
            return Task.FromResult(Result.Fail("Feature not yet implemented in domain layer."));
        }

        public Task<Result> AddTagToSongAsync(Guid songId, string tagName)
        {
            // This functionality would need to be implemented in the domain
            // For now, return a placeholder
            return Task.FromResult(Result.Fail("Feature not yet implemented in domain layer."));
        }

        public Task<Result> RemoveTagFromSongAsync(Guid songId, Guid tagId)
        {
            // This functionality would need to be implemented in the domain
            // For now, return a placeholder
            return Task.FromResult(Result.Fail("Feature not yet implemented in domain layer."));
        }

        public async Task<Result> DeleteSongAsync(Guid songId, Guid userId)
        {
            var song = await _songRepository.GetByIdAsync(songId);
            if (song == null)
            {
                return Result.Fail("Song not found.");
            }

            // Business rule: Only creator can delete song
            if (song.CreatorId != userId)
            {
                return Result.Fail("Only the creator can delete this song.");
            }

            await _songRepository.DeleteAsync(song);
            await _songRepository.SaveChangesAsync();
            return Result.Ok();
        }

        public async Task<Result<IEnumerable<TagDto>>> GetAllTagsAsync()
        {
            var tags = await _tagRepository.GetAllAsync();
            return Result.Ok(tags.Select(t => new TagDto
            {
                TagId = t.TagId,
                TagName = t.TagName
            }));
        }

        private static SongDto MapToSongDto(Song song)
        {
            return new SongDto
            {
                SongId = song.SongId,
                Title = song.Title,
                Artist = song.Artist,
                Content = song.Content,
                CreatorId = song.CreatorId,
                Visibility = (Application.Dtos.SongVisibilityType)(int)song.Visibility,
                BaseSongId = song.BaseSongId,
                CreatedAt = song.CreatedAt
            };
        }
    }
}
