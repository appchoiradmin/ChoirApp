using ChoirApp.Application.Contracts;
using FastEndpoints;
using System.Threading;
using System.Threading.Tasks;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class CountMasterSongsRequest
    {
        public string? Title { get; set; }
        public string? Artist { get; set; }
        public string? Tag { get; set; }
    }

    public class CountMasterSongsResponse
    {
        public int TotalCount { get; set; }
    }

    public class CountMasterSongsEndpoint : Endpoint<CountMasterSongsRequest, CountMasterSongsResponse>
    {
        private readonly IMasterSongService _masterSongService;

        public CountMasterSongsEndpoint(IMasterSongService masterSongService)
        {
            _masterSongService = masterSongService;
        }

        public override void Configure()
        {
            Verbs("GET");
            Routes("/master-songs/count");
            AuthSchemes("Bearer");
            Roles("ChoirAdmin", "SuperAdmin", "ChoirMember", "GeneralUser");
        }

        public override async Task HandleAsync(CountMasterSongsRequest req, CancellationToken ct)
        {
            var count = await _masterSongService.CountMasterSongsAsync(req.Title, req.Artist, req.Tag);
            await SendAsync(new CountMasterSongsResponse { TotalCount = count }, 200, ct);
        }
    }
}
