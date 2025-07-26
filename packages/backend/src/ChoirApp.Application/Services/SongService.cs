using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;

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

        public async Task<Result<SongDto>> CreateSongAsync(string title, string? artist, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility, List<Guid>? visibleToChoirs = null, List<string>? tags = null)
        {
            // Business rule: Creator must exist
            var user = await _userRepository.GetByIdAsync(creatorId);
            if (user == null)
            {
                return Result.Fail("User not found.");
            }

            // Business rule: If visibility is PublicChoirs, visibleToChoirs must be provided
            if (visibility == Domain.Entities.SongVisibilityType.PublicChoirs && (visibleToChoirs == null || !visibleToChoirs.Any()))
            {
                return Result.Fail("When visibility is PublicChoirs, at least one choir must be specified.");
            }

            // Create song using domain logic
            var songResult = Song.Create(title, artist, content, creatorId, visibility);
            if (songResult.IsFailed)
            {
                return Result.Fail(songResult.Errors);
            }

            var song = songResult.Value;
            await _songRepository.AddAsync(song);

            // Create SongVisibility records for PublicChoirs visibility
            if (visibility == Domain.Entities.SongVisibilityType.PublicChoirs && visibleToChoirs != null)
            {
                foreach (var choirId in visibleToChoirs)
                {
                    var songVisibility = new SongVisibility
                    {
                        VisibilityId = Guid.NewGuid(),
                        SongId = song.SongId,
                        ChoirId = choirId
                    };
                    song.Visibilities.Add(songVisibility);
                }
            }

            // Add tags if provided
            if (tags != null && tags.Any())
            {
                foreach (var tagName in tags)
                {
                    var tagResult = await AddTagToSongAsync(song.SongId, tagName);
                    if (tagResult.IsFailed)
                    {
                        // Log the error but don't fail the entire operation
                        Console.WriteLine($"Warning: Failed to add tag '{tagName}' to song: {tagResult.Errors.FirstOrDefault()?.Message}");
                    }
                }
            }

            await _songRepository.SaveChangesAsync();

            return Result.Ok(MapToSongDto(song));
        }

        public async Task<Result<SongDto>> CreateSongVersionAsync(Guid baseSongId, string content, Guid creatorId, Domain.Entities.SongVisibilityType visibility, List<Guid>? visibleToChoirs = null, List<string>? tags = null)
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

            // Business rule: If visibility is PublicChoirs, visibleToChoirs must be provided
            if (visibility == Domain.Entities.SongVisibilityType.PublicChoirs && (visibleToChoirs == null || !visibleToChoirs.Any()))
            {
                return Result.Fail("When visibility is PublicChoirs, at least one choir must be specified.");
            }

            // Create version using domain logic
            var versionResult = Song.CreateVersion(baseSong, content, creatorId, visibility);
            if (versionResult.IsFailed)
            {
                return Result.Fail(versionResult.Errors);
            }

            var version = versionResult.Value;
            await _songRepository.AddAsync(version);

            // Create SongVisibility records for PublicChoirs visibility
            if (visibility == Domain.Entities.SongVisibilityType.PublicChoirs && visibleToChoirs != null)
            {
                foreach (var choirId in visibleToChoirs)
                {
                    var songVisibility = new SongVisibility
                    {
                        VisibilityId = Guid.NewGuid(),
                        SongId = version.SongId,
                        ChoirId = choirId
                    };
                    version.Visibilities.Add(songVisibility);
                }
            }

            // Add tags if provided
            if (tags != null && tags.Any())
            {
                foreach (var tagName in tags)
                {
                    var tagResult = await AddTagToSongAsync(version.SongId, tagName);
                    if (tagResult.IsFailed)
                    {
                        // Log the error but don't fail the entire operation
                        Console.WriteLine($"Warning: Failed to add tag '{tagName}' to song version: {tagResult.Errors.FirstOrDefault()?.Message}");
                    }
                }
            }

            await _songRepository.SaveChangesAsync();

            return Result.Ok(MapToSongDto(version));
        }

        public async Task<Result<SongDto>> GetSongByIdAsync(Guid songId)
        {
            var song = await _songRepository.GetByIdWithTagsAsync(songId);
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

        public async Task<Result<SongDto>> UpdateSongAsync(Guid songId, string title, string? artist, string content, Guid userId, List<string>? tags = null)
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

            // Handle tags if provided - replace all existing tags
            if (tags != null)
            {
                // First, remove all existing tags from the song
                var existingSongTags = await _tagRepository.GetSongTagsAsync(song.SongId);
                foreach (var existingSongTag in existingSongTags)
                {
                    await _tagRepository.RemoveSongTagAsync(existingSongTag);
                }
                
                // Then add the new tags
                foreach (var tagName in tags)
                {
                    var tagResult = await AddTagToSongAsync(song.SongId, tagName);
                    if (tagResult.IsFailed)
                    {
                        Console.WriteLine($"Warning: Failed to add tag '{tagName}' to song: {tagResult.Errors.FirstOrDefault()?.Message}");
                    }
                }
            }

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

        public async Task<Result> AddTagToSongAsync(Guid songId, string tagName)
        {
            try
            {
                // 1. Validate inputs
                if (songId == Guid.Empty || string.IsNullOrWhiteSpace(tagName))
                    return Result.Fail("Invalid song ID or tag name");

                // 2. Normalize tag name to Pascal case
                var normalizedTagName = NormalizeTagName(tagName.Trim());
                
                // 3. Check if tag already exists (case-insensitive)
                var existingTag = await _tagRepository.GetByNameAsync(normalizedTagName);
                
                // 4. Create tag if it doesn't exist
                if (existingTag == null)
                {
                    existingTag = new Tag 
                    { 
                        TagId = Guid.NewGuid(), 
                        TagName = normalizedTagName 
                    };
                    await _tagRepository.AddAsync(existingTag);
                    await _tagRepository.SaveChangesAsync();
                }
                
                // 5. Check if song-tag relationship already exists
                var existingSongTag = await _tagRepository.GetSongTagAsync(songId, existingTag.TagId);
                
                // 6. Create relationship if it doesn't exist
                if (existingSongTag == null)
                {
                    var songTag = new SongTag 
                    { 
                        SongId = songId, 
                        TagId = existingTag.TagId 
                    };
                    await _tagRepository.AddSongTagAsync(songTag);
                }
                
                return Result.Ok();
            }
            catch (Exception ex)
            {
                return Result.Fail($"Failed to add tag to song: {ex.Message}");
            }
        }

        public async Task<Result> RemoveTagFromSongAsync(Guid songId, Guid tagId)
        {
            try
            {
                // 1. Validate inputs
                if (songId == Guid.Empty || tagId == Guid.Empty)
                    return Result.Fail("Invalid song ID or tag ID");

                // 2. Check if song-tag relationship exists
                var existingSongTag = await _tagRepository.GetSongTagAsync(songId, tagId);
                
                if (existingSongTag == null)
                    return Result.Fail("Tag is not associated with this song");
                
                // 3. Remove the relationship
                await _tagRepository.RemoveSongTagAsync(existingSongTag);
                
                return Result.Ok();
            }
            catch (Exception ex)
            {
                return Result.Fail($"Failed to remove tag from song: {ex.Message}");
            }
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
                CreatedAt = song.CreatedAt,
                Tags = song.Tags?.Where(st => st.Tag != null).Select(st => new TagDto
                {
                    TagId = st.Tag.TagId,
                    TagName = st.Tag.TagName
                }).ToList() ?? new List<TagDto>()
            };
        }

        private string NormalizeTagName(string tagName)
        {
            if (string.IsNullOrWhiteSpace(tagName))
                return string.Empty;
                
            // Convert to Pascal case: "christmas" -> "Christmas", "HYMN" -> "Hymn"
            var trimmed = tagName.Trim();
            return char.ToUpper(trimmed[0]) + trimmed.Substring(1).ToLower();
        }
    }
}
