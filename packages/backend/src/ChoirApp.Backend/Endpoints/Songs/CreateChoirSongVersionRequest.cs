using ChoirApp.Application.Dtos;
using System;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class CreateChoirSongVersionRequest
    {
        public Guid ChoirId { get; set; }
        public CreateChoirSongVersionDto SongDto { get; set; } = null!;
    }
}
