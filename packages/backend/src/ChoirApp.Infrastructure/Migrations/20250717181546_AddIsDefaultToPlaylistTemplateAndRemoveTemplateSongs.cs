using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDefaultToPlaylistTemplateAndRemoveTemplateSongs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlaylistTemplateSongs");
                
            migrationBuilder.AddColumn<bool>(
                name: "is_default",
                table: "PlaylistTemplates",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_default",
                table: "PlaylistTemplates");
                
            migrationBuilder.CreateTable(
                name: "PlaylistTemplateSongs",
                columns: table => new
                {
                    template_song_id = table.Column<Guid>(type: "uuid", nullable: false),
                    section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    song_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaylistTemplateSongs", x => x.template_song_id);
                    table.ForeignKey(
                        name: "FK_PlaylistTemplateSongs_PlaylistTemplateSections_section_id",
                        column: x => x.section_id,
                        principalTable: "PlaylistTemplateSections",
                        principalColumn: "section_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaylistTemplateSongs_Songs_song_id",
                        column: x => x.song_id,
                        principalTable: "Songs",
                        principalColumn: "song_id");
                });
                
            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTemplateSongs_section_id",
                table: "PlaylistTemplateSongs",
                column: "section_id");
                
            migrationBuilder.CreateIndex(
                name: "IX_PlaylistTemplateSongs_song_id",
                table: "PlaylistTemplateSongs",
                column: "song_id");
        }
    }
}
