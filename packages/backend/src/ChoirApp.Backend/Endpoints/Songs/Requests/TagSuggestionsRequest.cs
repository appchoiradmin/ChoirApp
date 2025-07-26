namespace ChoirApp.Backend.Endpoints.Songs.Requests;

public class TagSuggestionsRequest
{
    public string? Query { get; set; }
    public int MaxResults { get; set; } = 10;
}
