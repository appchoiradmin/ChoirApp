using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Backend.Endpoints.Songs.Requests;
using ChoirApp.Domain.Entities;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.Songs;

public class TagSuggestionsEndpoint : Endpoint<TagSuggestionsRequest, IEnumerable<TagDto>>
{
    private readonly ITagRepository _tagRepository;

    public override void Configure()
    {
        Verbs("GET");
        Routes("/tags/suggestions");
        AuthSchemes("Bearer");
        Roles(nameof(UserRole.ChoirAdmin), nameof(UserRole.ChoirMember), nameof(UserRole.GeneralUser));
    }

    public TagSuggestionsEndpoint(ITagRepository tagRepository)
    {
        _tagRepository = tagRepository;
    }

    public override async Task HandleAsync(TagSuggestionsRequest req, CancellationToken ct)
    {
        var tags = await _tagRepository.SearchTagsAsync(req.Query ?? string.Empty, req.MaxResults);
        
        var tagDtos = tags.Select(t => new TagDto
        {
            TagId = t.TagId,
            TagName = t.TagName
        });

        await SendOkAsync(tagDtos, ct);
    }
}
