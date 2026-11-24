package com.ecommerce.store.contract;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The frozen HTTP contract, read from the documents so there is only one copy of it (ADR-0017).
 */
public record Contract(List<Endpoint> endpoints, Map<String, Signature> signatures, Map<String, List<Field>> dtos,
		Map<String, List<String>> enums) {

	public record Endpoint(String module, String method, String path, String access, String returns, int status,
			String limit) {

		public String key() {
			return method + " " + path;
		}

		/** The path with every variable written as {}, so names do not matter when comparing. */
		public String shape() {
			return shapeOf(path);
		}

	}

	public record Signature(String parameters, String returns, int status) {
	}

	public record Field(String name, String type, String rules) {
	}

	static final Path ROOT = repositoryRoot();

	private static final Pattern MODULE = Pattern.compile("^### (\\w+) \\(\\d+\\)$");

	private static final Pattern DTO = Pattern.compile("^### (\\w+)$");

	private static final Pattern ENUM = Pattern.compile("^- `(\\w+)`: (`[A-Z_]+`(?:, `[A-Z_]+`)*)$");

	public static Contract load() {
		List<String> dtoLines = lines("docs/CONTRACT-DTOS.md");
		return new Contract(endpoints(lines("docs/API-CONTRACT.md")), signatures(dtoLines), dtos(dtoLines),
				enums(dtoLines));
	}

	public static String shapeOf(String path) {
		return path.replaceAll("\\{[^}]*}", "{}");
	}

	private static List<Endpoint> endpoints(List<String> lines) {
		List<Endpoint> found = new ArrayList<>();
		String module = null;
		for (String line : lines) {
			Matcher heading = MODULE.matcher(line);
			if (heading.matches()) {
				module = heading.group(1);
			}
			List<String> cells = cells(line);
			if (module != null && cells.size() == 7 && isMethod(cells.get(0))) {
				found.add(new Endpoint(module, cells.get(0), bare(cells.get(1)), cells.get(2), bare(cells.get(3)),
						Integer.parseInt(cells.get(4)), cells.get(6)));
			}
		}
		return found;
	}

	private static Map<String, Signature> signatures(List<String> lines) {
		Map<String, Signature> found = new LinkedHashMap<>();
		for (String line : lines) {
			List<String> cells = cells(line);
			if (cells.size() == 5 && isMethod(cells.get(0))) {
				found.put(cells.get(0) + " " + bare(cells.get(1)),
						new Signature(cells.get(2), bare(cells.get(3)), Integer.parseInt(cells.get(4))));
			}
		}
		return found;
	}

	private static Map<String, List<Field>> dtos(List<String> lines) {
		Map<String, List<Field>> found = new LinkedHashMap<>();
		List<Field> current = null;
		for (String line : lines) {
			Matcher heading = DTO.matcher(line);
			if (heading.matches()) {
				current = new ArrayList<>();
				found.put(heading.group(1), current);
			}
			else if (line.startsWith("## ")) {
				current = null;
			}
			List<String> cells = cells(line);
			if (current != null && cells.size() == 3 && cells.get(0).startsWith("`")) {
				current.add(new Field(bare(cells.get(0)), bare(cells.get(1)), cells.get(2)));
			}
		}
		return found;
	}

	private static Map<String, List<String>> enums(List<String> lines) {
		Map<String, List<String>> found = new LinkedHashMap<>();
		for (String line : lines) {
			Matcher matcher = ENUM.matcher(line);
			if (matcher.matches()) {
				found.put(matcher.group(1), List.of(matcher.group(2).replace("`", "").split(", ")));
			}
		}
		return found;
	}

	private static List<String> cells(String line) {
		if (!line.startsWith("|") || !line.endsWith("|")) {
			return List.of();
		}
		List<String> cells = new ArrayList<>();
		for (String cell : line.substring(1, line.length() - 1).split("\\|", -1)) {
			cells.add(cell.strip());
		}
		return cells;
	}

	private static boolean isMethod(String cell) {
		return List.of("GET", "POST", "PUT", "PATCH", "DELETE").contains(cell);
	}

	private static String bare(String cell) {
		return cell.replace("`", "");
	}

	private static List<String> lines(String file) {
		try {
			return Files.readAllLines(ROOT.resolve(file));
		}
		catch (IOException ex) {
			throw new UncheckedIOException(ex);
		}
	}

	private static Path repositoryRoot() {
		Path dir = Path.of("").toAbsolutePath();
		while (dir != null && !Files.exists(dir.resolve("docs/API-CONTRACT.md"))) {
			dir = dir.getParent();
		}
		if (dir == null) {
			throw new IllegalStateException("docs/API-CONTRACT.md not found above " + Path.of("").toAbsolutePath());
		}
		return dir;
	}

}
