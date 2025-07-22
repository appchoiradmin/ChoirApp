using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChoirApp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGlobalPlaylistTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "PlaylistTemplateSections",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "suggested_song_types",
                table: "PlaylistTemplateSections",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GlobalPlaylistTemplates",
                columns: table => new
                {
                    global_template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GlobalPlaylistTemplates", x => x.global_template_id);
                });

            migrationBuilder.CreateTable(
                name: "GlobalPlaylistTemplateSections",
                columns: table => new
                {
                    global_template_section_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    suggested_song_types = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    order = table.Column<int>(type: "integer", nullable: false),
                    global_template_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GlobalPlaylistTemplateSections", x => x.global_template_section_id);
                    table.ForeignKey(
                        name: "FK_GlobalPlaylistTemplateSections_GlobalPlaylistTemplates_glob~",
                        column: x => x.global_template_id,
                        principalTable: "GlobalPlaylistTemplates",
                        principalColumn: "global_template_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GlobalPlaylistTemplateSections_global_template_id",
                table: "GlobalPlaylistTemplateSections",
                column: "global_template_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GlobalPlaylistTemplateSections");

            migrationBuilder.DropTable(
                name: "GlobalPlaylistTemplates");

            migrationBuilder.DropColumn(
                name: "description",
                table: "PlaylistTemplateSections");

            migrationBuilder.DropColumn(
                name: "suggested_song_types",
                table: "PlaylistTemplateSections");
        }
    }
}
