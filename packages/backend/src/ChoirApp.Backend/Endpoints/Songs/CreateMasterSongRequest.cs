using ChoirApp.Application.Dtos;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class CreateMasterSongRequest
    {
        public CreateMasterSongDto SongDto { get; set; } = null!;
    }
}
