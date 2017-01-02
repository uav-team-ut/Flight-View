#ifndef TARGET_H
#define TARGET_H

#ifdef __cplusplus
extern "C" {
#endif

const char *TARGET_ORIENTATIONS[];
const char *TARGET_SHAPES[];
const char *TARGET_COLORS[];

struct Coordinate {
    int x;
    int y;
};

struct Target {
    char *originalImage;
    struct Coordinate topLeft;
    struct Coordinate bottomRight;

    char *orientation;
    char *shape;
    char *backgroundColor;
    char *alphanumeric;
    char *alphanumericColor;
};

Target *getTargets(char *image);

#ifdef __cplusplus
}
#endif

#endif
