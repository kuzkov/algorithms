function lastSurvivor(letters, coords) {
  return coords
    .reduce(
      (result, index) =>
        result.filter((letter, currentIndex) => index !== currentIndex),
      letters.split("")
    )
    .join("");
}
