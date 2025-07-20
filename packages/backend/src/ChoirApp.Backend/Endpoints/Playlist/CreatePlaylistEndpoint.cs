using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

// Use alias to resolve ambiguity
using DomainEntities = ChoirApp.Domain.Entities;

namespace ChoirApp.Backend.Endpoints.Playlist
{
    public class CreatePlaylistEndpoint : Endpoint<CreatePlaylistDto, PlaylistDto>
    {
        private readonly IPlaylistService _playlistService;

        public CreatePlaylistEndpoint(IPlaylistService playlistService)
        {
            _playlistService = playlistService;
        }

        public override void Configure()
        {
            Verbs("POST", "OPTIONS");
            Routes("/playlists");
            AuthSchemes("Bearer");
            Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember));
        }

        public override async Task HandleAsync(CreatePlaylistDto req, CancellationToken ct)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                ThrowError("User not authenticated properly.");
                return;
            }

            var result = await _playlistService.CreatePlaylistAsync(req, userId);

            if (result.IsFailed)
            {
                AddError(result.Errors.First().Message);
                await SendErrorsAsync(cancellation: ct);
                return;
            }

            var playlist = result.Value;
            var response = new PlaylistDto
            {
                Id = playlist.PlaylistId,
                Title = playlist.Name,
                IsPublic = playlist.Visibility == DomainEntities.SongVisibilityType.PublicAll,
                ChoirId = playlist.ChoirId ?? Guid.Empty,
                Date = playlist.CreatedAt.DateTime,
                PlaylistTemplateId = null, // This field doesn't exist in the new model
                Sections = playlist.Sections
                    .OrderBy(s => s.Order)
                    .Select(s => new PlaylistSectionDto
                {
                    Id = s.SectionId,
                    Title = s.Title,
                    Order = s.Order,
                    Songs = s.PlaylistSongs
                        .OrderBy(ps => ps.Order)
                        .Select(ps => new PlaylistSongDto
                    {
                        Id = ps.PlaylistSongId,
                        Order = ps.Order,
                        SongId = ps.SongId,
                        Song = ps.Song == null ? null : new SongDto
                        {
                            SongId = ps.Song.SongId,
                            Title = ps.Song.Title,
                            Artist = ps.Song.Artist,
                            Content = ps.Song.Content,
                            CreatedAt = ps.Song.CreatedAt,
                            CreatorId = ps.Song.CreatorId,
                            CreatorName = ps.Song.Creator?.Name ?? string.Empty,
                            Visibility = (Application.Dtos.SongVisibilityType)ps.Song.Visibility,
                            Tags = ps.Song.Tags
                                .Where(t => t.Tag != null)
                                .Select(t => new TagDto
                                {
                                    TagId = t.Tag!.TagId,
                                    TagName = t.Tag!.TagName
                                }).ToList()
                        }
                    }).ToList()
                }).ToList()
            };

            await SendAsync(response, 201, ct);
        }
    }
}
